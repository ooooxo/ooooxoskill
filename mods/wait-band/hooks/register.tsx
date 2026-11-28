// wait-band：本会话里 ~/.claude/tools/waitfor 在等什么——输入框上方一行常驻（出事的标红写原因），点它或 /w 开窗看全部、点一条看尾巴；
// 后台的卡住了叫 agent：静默卡住，或同一条报错反复出现（重试死循环）。零星报错只标红不叫：命令很快会退，完成通知自带尾巴；边跑边叫只会让 agent 半途动手
// 怎么跑：CLAUDE_CODE_PLUGIN_DIRS 指着本目录，随会话加载；数据源是 waitfor 每秒写的 /tmp/waitfor/p<Claude 进程号>/<pid>.json
// 需要：~/.claude/tools/waitfor（带 state / wave / ended 字段那版）
//
// 只画在输入框上方（AbovePrompt）：试过顶部（Underlay），只在全屏布局、只画空白格，实际常看不见。行右的 [-] 是引擎自带的折叠钮，插件去不掉。
// 状态目录按 Claude 进程号分（/tmp/waitfor/p<进程号>），和 waitfor 读的 CLAUDE_PID 对上；别改回按会话 ID：--resume / /clear 会换 ID，两边就对不上
import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Row, Wait } from '../types'

const POLL_MS = 1000
const STALE_S = 5 // 没 ended 却这么久没更新 = waitfor 被硬杀
const SHOW_ENDED_S = 8 // 结束的那条留这么久再撤，看得清是 ✓ 还是 ✗
const DROP_S = 120 // 结束这么久的状态文件删掉（日志留着，按天清）
const SWEEP_MS = 3600_000 // 多久清一次 /tmp/waitfor 里一天前的日志和目录：会话能开好几天，只在启动时清会一直堆
const WAVE = 24
const TAIL = 5
const PANE = 'waits'

const waits = atom({ plugin: 'wait-band', key: 'waits' } as const, [])
const open = atom({ plugin: 'wait-band', key: 'open' } as const, [])
// 本会话发出的后台 Bash（命令 + 发出时刻，秒）：waitfor 的状态里没有「是不是后台」，按标签对上这里的命令来认。
// 存在插件状态里而不是模块变量：每轮之间改了代码就热重载，模块变量会清空，重载前起的后台任务出事就叫不到 agent
const bgCalls = atom({ plugin: 'wait-band', key: 'bg' } as const, [])
const BG_KEEP = 50
// 命令里 `-l` 后面跟的就是这个标签（裸写 / 单引号 / 双引号）。别用 includes：「x 冷」会把前台的「x」认成后台
const labelIn = (cmd: string, label: string) => {
  const esc = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`-l\\s+(?:'${esc}'|"${esc}"|${esc})(?:\\s|$)`).test(cmd)
}

const cols = (s: string) => [...s].reduce((n, c) => n + (c.charCodeAt(0) > 0x2e7f ? 2 : 1), 0)
const clip = (s: string, n: number) => {
  let o = ''
  for (const c of s) {
    if (cols(o + c) > n - 1) return o + '…'
    o += c
  }
  return o
}
// 日志里的原样输出带 ANSI 颜色、\r 进度重绘、OSC 链接：界面的 Text 收到控制字符整棵树都不画。
// \r 只留最后一段（终端上最终看到的那段），再剥转义、剩下的控制字符丢掉
const plain = (s: string) =>
  (s.split('\r').filter(p => p.trim()).pop() ?? '')
    .replace(/\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)/g, '')
    .replace(/\x1b\[[0-?]*[ -\/]*[@-~]/g, '')
    .replace(/\x1b[@-_]?/g, '')
    .replace(/\t/g, '  ')
    .replace(/[\x00-\x1f\x7f-\x9f]/g, '')
const padTo = (s: string, n: number) => { const c = clip(s, n); return c + ' '.repeat(Math.max(0, n - cols(c))) }
const ended = (w: Wait) => w.ended !== null
// 「开着」只认真画出来的：窄屏时插件自己开的窗引擎只登记不画（isPlaced: false），当成开着就会把那一行也收掉，两边都看不见
const paneShown = async ($: EngineInterface) => (await $.ui.panes()).some(p => p.id === PANE && p.isPlaced)
const parked = (w: Wait) => w.state === 'park'
const errLine = (w: Wait) => (w.state === 'loop' ? w.loopErr : w.state === 'err' ? w.err : '')
const stuck = (w: Wait) => w.state === 'stuck' || w.state === 'loop'
const bad = (w: Wait) => stuck(w) || w.state === 'err' || w.state === 'fail'

const reason = (w: Wait) =>
  w.state === 'ok' ? '完成'
  : w.state === 'fail' ? (w.code === null ? '失联' : w.code === 5 ? '已停止' : w.code === 4 ? '卡住被停' : w.code === 2 ? '超时' : `退出 ${w.code}`)
  : w.state === 'stuck' ? `静 ${w.quiet}s，卡住`
  : w.state === 'loop' ? `同一报错 ×${w.loopN}，在循环`
  : w.state === 'park' ? `${w.elapsed}s`
  : w.state === 'err' ? `${w.errs} 处报错`
  : w.state === 'quiet' ? `静 ${w.quiet}s`
  : ''

// 短：agent 知道该干什么，只给事实。带最后一行，不开日志就能先分卡死还是慢；id 让它对上自己发的哪条命令
const alertText = (w: Wait) =>
  w.state === 'loop'
    ? `[waitfor] 「${w.title}」(${w.label}) 同一条报错反复 ${w.loopN} 次，疑似重试死循环 · 报错：${w.loopErr} · ${w.log}`
    : `[waitfor] 「${w.title}」(${w.label}) 静 ${w.quiet}s，疑似卡住 · 最后一行：${w.last || '（无输出）'} · ${w.log}`

// /w 窗开着还是收着，按项目根记在 ~/.claude/tools/.wait-band-pane.json（{ 根路径: true }）：下一批等待出现时照原样摆，重启也记得。
// 只认人的意图：/w、点那一行、Esc 改它；没东西可等时插件自己收窗不算。模块变量是缓存，热重载后从文件再读
let paneWanted: boolean | undefined
// 窗是插件按偏好自己开的（不是人 /w 开的）：只剩挂着等人的那几条时收回去；人开来看挂着那条的不收
let autoOpened = false
const prefPath = async ($: EngineInterface) => `${(await $.process.run(['/bin/sh', '-c', 'echo $HOME'])).stdout.trim()}/.claude/tools/.wait-band-pane.json`
const loadPrefs = async ($: EngineInterface) => {
  const path = await prefPath($)
  return { path, all: (await $.fs.exists(path)) ? (JSON.parse(await $.fs.read(path)) as Record<string, boolean>) : {} }
}
const wantPane = async ($: EngineInterface) => {
  if (paneWanted === undefined) paneWanted = (await loadPrefs($)).all[await $.session.root()] === true
  return paneWanted
}
const setWantPane = async ($: EngineInterface, v: boolean) => {
  paneWanted = v
  const { path, all } = await loadPrefs($)
  const root = await $.session.root()
  if (v) all[root] = true
  else delete all[root]
  await $.fs.write(path, JSON.stringify(all, null, 2) + '\n')
}

// 主循环在跑：submit 要等空闲才送达，排着的提醒送到时任务往往已经结束。所以忙时不发，空闲那一刻按现状再判。
// 模块变量即可：热重载只发生在两轮之间，那时本就空闲
let busy = false

export const register: Register = on => {
  // 只记、不改命令：改写输入会让 auto 模式的审查对不上、每条后台命令都被拦，所以也不自动套 waitfor
  on('tool.call', { tool: 'Bash' }, ($, e, next) => {
    if (e.tool === 'Bash' && e.run_in_background && /(^|[\s;&|(])(\S*\/)?waitfor\s/.test(e.command)) {
      const call = { cmd: e.command, at: Date.now() / 1000 }
      return update($, bgCalls, b => [...b, call].slice(-BG_KEEP)).then(() => next(e))
    }
    return next(e)
  })

  on('turn.start', ($, e, next) => {
    if (e.agentId === undefined) busy = true
    return next(e)
  })
  on('turn.complete', ($, e, next) => {
    if (e.agentId === undefined) busy = false
    return next(e)
  })

  on('ui.close', async ($, e, next) => {
    if (e.id === PANE && e.origin.kind === 'person') {
      autoOpened = false
      await setWantPane($, false)
    }
    return next(e)
  })

  on('command.run', { command: 'w' }, async $ => {
    await togglePane($)
    return { text: undefined, isTextDisplayOnly: true }
  })

  on('session.start', async ($, e, next) => {
    // $.process.run 起的 sh 的父进程就是 Claude 本身
    const claudePid = (await $.process.run(['/bin/sh', '-c', 'echo $PPID'])).stdout.trim()
    const dir = `/tmp/waitfor/p${claudePid}`
    const sweep = () => $.process.run(['/bin/sh', '-c',
      'find /tmp/waitfor -mindepth 2 -name "*.log" -mtime +1 -delete 2>/dev/null; find /tmp/waitfor -mindepth 1 -maxdepth 1 -mtime +1 -exec rm -rf {} + 2>/dev/null; true'])
    await sweep()
    $.clock.every(SWEEP_MS, () => void sweep())

    const alerted = new Set<string>()
    let paneAt = 0
    let autoTried = false // 这一批等待里按记住的偏好自动开过窗了：窄屏时引擎不给摆（isPlaced: false），别每秒重试
    let shown = '' // 别初始化成 '[]'：状态跨热重载保留，重载前的条目要靠第一次轮询无条件刷掉
    let failed = ''
    let polling = false // 上一轮没跑完（主机忙、tail 慢）就跳过这一拍，不叠
    $.clock.every(POLL_MS, () => {
      if (polling) return
      polling = true
      poll().catch((err: unknown) => {
        // 轮询坏了要喊出来，不然条就是悄悄不见
        if (String(err) !== failed) $.ui.toast(`wait-band 轮询出错：${(failed = String(err))}`, { timeoutMs: 15000 })
      }).finally(() => { polling = false })
    })
    const poll = async () => {
      const now = (await $.clock.now()) / 1000
      const files = (await $.fs.exists(dir)) ? (await $.fs.list(dir)).filter(f => f.name.endsWith('.json')) : []
      const opened = await read($, open)
      const bg = await read($, bgCalls)
      const rows: Row[] = []
      const drop: string[] = []
      for (const f of files) {
        const path = `${dir}/${f.name}`
        const w = await $.fs.read(path).then(t => JSON.parse(t) as Wait).catch(() => null)
        if (w === null) continue
        if (!ended(w) && now - f.mtimeMs / 1000 > STALE_S) Object.assign(w, { ended: Math.floor(f.mtimeMs / 1000), state: 'fail', code: null })
        const age = ended(w) ? now - (w.ended as number) : 0
        if (age > DROP_S) drop.push(path)
        if (age > SHOW_ENDED_S) continue
        const tail = opened.includes(w.pid)
          ? (await $.process.run(['tail', '-n', String(TAIL), w.log])).stdout.split('\n').map(plain).filter(Boolean)
          : []
        Object.assign(w, { title: plain(w.title), err: plain(w.err), loopErr: plain(w.loopErr), last: plain(w.last) })
        rows.push({ ...w, file: path, tail })

        w.bg = w.bg || bg.some(c => labelIn(c.cmd, w.label) && w.started >= c.at - 10)
        const fire = !busy && w.bg && !ended(w) && stuck(w)
        const key = `${w.pid}:${w.state}`
        if (fire && !alerted.has(key)) {
          alerted.add(key)
          void $.prompt.submit({ text: alertText(w) })
        }
      }
      if (drop.length) await $.process.run(['rm', '-f', ...drop])
      // 叫过的、展开过的只留还在的那几条，长会话里不越攒越多
      const live = new Set(files.map(f => f.name.replace(/\.json$/, '')))
      for (const k of alerted) if (!live.has(k.split(':')[0] ?? '')) alerted.delete(k)
      if (opened.some(p => !live.has(String(p)))) await update($, open, o => o.filter(p => live.has(String(p))))
      rows.sort((a, b) => Number(parked(a)) - Number(parked(b)) || a.started - b.started)   // 挂着的排最后
      const key = JSON.stringify(rows)
      if (key !== shown) {
        shown = key
        await update($, waits, () => rows)
      }
      const pane = (await $.ui.panes()).find(p => p.id === PANE)
      if (pane && !pane.isPlaced) {
        // 登记了没画出来的窗收掉，让那一行回来
        autoOpened = false
        await $.ui.close({ id: PANE })
      }
      const paneUp = pane?.isPlaced === true
      // 挂着等人的不算「在等」：只剩它们时，这一批就算完了
      const active = rows.some(w => !parked(w))
      if (!active) {
        autoTried = false
        if (paneUp && (rows.length === 0 || autoOpened)) {
          paneAt = 0
          autoOpened = false
          await $.ui.close({ id: PANE })
        }
        if (rows.length === 0) return
      }
      const want = paneRows(rows, opened)
      if (active && !paneUp && !autoTried && (await wantPane($))) {
        autoTried = true
        autoOpened = true
        paneAt = want
        // 不带 focus：自己弹出来的窗不抢输入框。窄屏不给摆就算了，这一批不再试，那一行照常
        const res = await $.ui.open({ id: PANE, title: 'waitfor', closeOnEscape: true, rows: want })
        if (!res.isPlaced) {
          autoOpened = false
          await $.ui.close({ id: PANE })
        }
        return
      }
      if (want !== paneAt && paneUp) {
        paneAt = want
        await $.ui.open({ id: PANE, title: 'waitfor', closeOnEscape: true, rows: want })
      }
    }
    await $.command.register({ name: 'w', description: '开 / 收 waitfor 停靠窗：在等的全部，点一条看最后几行' })
    return next(e)
  })

  // 输入框上方的格子：星标是 surface 模块（spin.tsx），在界面那边按帧转、不跟每秒一次的轮询；字是 Button，点它（或聚焦后 Enter）开 / 收 /w
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const list = await read($, waits)
    // /w 的窗开着就不画：窗里已经是全部，两处同时显示是重复。窗关了，下一次轮询重画时回来
    if (list.length === 0 || (await paneShown($))) return next(e)
    const els = $.ui.resolve(e)
    // 没有 Client 的界面（只给静态元素的那几种）不画这块；终端和桌面都有
    if (!('Client' in els)) return next(e)
    const { Box, Text, Button, Client } = els
    const per = Math.max(1, Math.min(CELLS, Math.floor((e.props.bodyColumns + GAP) / (CELL_MIN + GAP))))
    const width = Math.floor((e.props.bodyColumns + GAP) / per) - GAP
    const lines: Row[][] = []
    for (let i = 0; i < list.length; i += per) lines.push(list.slice(i, i + per))
    return (
      <Box flexDirection="column">
        {lines.map((line, li) => (
          <Box key={`l${li}`} flexDirection="row">
            {line.map((w, ci) => {
              const c = cellOf(w)
              const room = Math.max(1, width - 3 - cols(c.tail.map(t => t.t).join('')))
              return (
                <Box key={c.key} width={width} marginLeft={ci ? GAP : 0} flexDirection="row">
                  {c.spin
                    ? <Client key={`g${c.key}`} module="./spin.tsx" props={{ tone: c.tone, phase: li * per + ci }} width={1} />
                    : <Box width={1}><Text color={c.tone}>{c.mark}</Text></Box>}
                  <Button key={`b${c.key}`} plain onPress={() => togglePane($)}>
                    <Text>{` ${padTo(c.title, room)} `}</Text>
                    {c.tail.map((t, ti) => <Text key={`t${ti}`} color={t.color || undefined} dimColor={t.dim}>{t.t}</Text>)}
                  </Button>
                </Box>
              )
            })}
          </Box>
        ))}
      </Box>
    )
  })
  // 星标模块载不进来 / 画崩了：喊出来，不然就是悄悄没了
  on('ui.fault', ($, e, next) => {
    $.ui.toast(`wait-band 状态条画不出来：${e.reason}`, { timeoutMs: 15000 })
    return next(e)
  })

  // /w 的停靠窗：全部，每条一行，点 / Enter 展开
  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const list = await read($, waits)
    const opened = await read($, open)
    const { Box, Text, Button } = $.ui.resolve(e)
    const v = views(Text)
    return (
      <Box flexDirection="column">
        {list.map(w => v.row(w, opened.includes(w.pid), Box, Button, () => toggle($, w.pid), () => stopWait($, w.pid)))}
      </Box>
    )
  })
}

type Ui = { Box: any; Text: any; Button: any }
// 缩略态是格子：一行最多 CELLS 格，格宽 = 可用宽度均分、和条数无关——条目来去时位置不跳，上下行对齐。
// 窄到一格不足 CELL_MIN 就少放几格；放不下的折到下一行。格里：星标（1 格宽，推不动标题）· 标题（放不下截）· 右对齐的时间 / 进度 / 原因。
// 字是 Button：按下才算人按的，窄屏时 /w 才开得出来（surface 模块 post 过来的不算，引擎会把窗登记了不画）
const CELLS = 3
const CELL_MIN = 24
const GAP = 2
type Seg = { t: string; color: string; dim: boolean }
type Cell = { key: string; spin: boolean; tone: string; mark: string; title: string; tail: Seg[] }
// 命令自己报了进度（[n/m] 或 n%）就只显示百分比、不显示时长：有真进度时时长是噪音。不画进度条（画过，格子里太挤）
const hasPct = (w: Row) => w.pct !== null && !bad(w) && !parked(w) && w.state !== 'ok'
// 静态符号：完成 ✓、失败 ✗、卡住 / 循环 红 !、等你 绿 ◌（挂着的一挂几小时，动着会分心，所以不转）；其余是转圈的星标
const markOf = (w: Row): [string, string] | null =>
  w.state === 'ok' ? ['✓', 'success'] : w.state === 'fail' ? ['✗', 'error']
  : stuck(w) ? ['!', 'error'] : parked(w) ? ['◌', 'success'] : null
const seg = (t: string, color = '', dim = false): Seg => ({ t, color, dim })
const cellOf = (w: Row): Cell => {
  const mark = markOf(w)
  const tail = parked(w) ? [seg(reason(w), '', true)]
    : bad(w) || w.state === 'ok' ? [seg(reason(w), w.state === 'ok' ? 'success' : 'error')]
    : hasPct(w) ? [seg(`${w.pct}%`, 'success')]
    : [seg(`${w.elapsed}s`, w.usual !== null && w.elapsed > w.usual ? 'warning' : ''), seg(`/${w.usual === null ? '∞' : `${w.usual}s`}`, '', true)]
  return { key: String(w.pid), spin: mark === null, tone: mark ? mark[1] : w.state === 'err' ? 'error' : w.state === 'quiet' ? 'warning' : 'claude',
    mark: mark ? mark[0] : '', title: w.title, tail }
}
// 窗按内容定高：不给 rows 就默认占三分之一屏，内容少时底下空一大块
const paneRows = (list: Row[], opened: number[]) =>
  Math.max(1, list.reduce((n, w) => n + 1 + (opened.includes(w.pid) ? w.tail.length + 1 + (errLine(w) ? 1 : 0) : 0), 0))
const togglePane = async ($: EngineInterface) => {
  if (await paneShown($)) {
    await setWantPane($, false)
    return $.ui.close({ id: PANE })
  }
  const list = await read($, waits)
  if (list.length === 0) return $.ui.toast('没有在等的')
  await setWantPane($, true)
  autoOpened = false
  await $.ui.open({ id: PANE, title: 'waitfor', focus: true, closeOnEscape: true, rows: paneRows(list, await read($, open)) })
}
// TERM 给 waitfor：它连子进程组一起停、写「被手动停止」（退出码 5），后台任务的完成通知照常叫 agent，agent 知道是人停的
const stopWait = ($: EngineInterface, pid: number) => $.process.run(['kill', '-TERM', String(pid)])
const toggle = ($: Parameters<typeof update>[0], pid: number) => update($, open, o => (o.includes(pid) ? o.filter(p => p !== pid) : [...o, pid]))

// 一条怎么画：符号 · 时间 · 24 格波 · 一行（R2·3）
const views = (Text: Ui['Text']) => {
  // 窗每秒才重画一次，星标在这里转是一跳一跳的：定在 ✻，动静看波形
  const glyph = (w: Row) => {
    const c = cellOf(w)
    return <Text color={c.tone}>{c.spin ? '✻' : c.mark}</Text>
  }

  const time = (w: Row) => (
    <Text>
      <Text color={w.usual !== null && w.elapsed > w.usual ? 'warning' : undefined}>{w.elapsed}s</Text>
      <Text dimColor>/{w.usual === null ? '∞' : `${w.usual}s`}</Text>
    </Text>
  )

  // 一格一秒：有输出是柱（高低 = 行数），没输出是点；卡住时尾巴那段没输出画成红底线
  const wave = (w: Row) => {
    const v = w.wave.slice(-WAVE)
    let trail = 0
    for (let i = v.length - 1; i >= 0 && v[i] === 0; i--) trail++
    return v.map((n, i) => {
      if (n > 0) return <Text key={`v${i}`} color={ended(w) ? undefined : 'success'} dimColor={ended(w)}>{n >= 10 ? '█' : n >= 4 ? '▆' : n >= 2 ? '▄' : '▂'}</Text>
      if (i >= v.length - trail && w.state === 'stuck') return <Text key={`v${i}`} color="error">▁</Text>
      return <Text key={`v${i}`} dimColor>·</Text>
    })
  }

  const why = (w: Row) => {
    const r = reason(w)
    if (!r) return null
    if (parked(w)) return <Text dimColor>  {r}</Text>
    const color = w.state === 'ok' ? 'success' : w.state === 'quiet' ? 'warning' : 'error'
    return <Text color={color}>  {r}{stuck(w) && w.bg ? <Text dimColor> → 已叫 agent</Text> : null}</Text>
  }

  const row = (w: Row, isOpen: boolean, Box: Ui['Box'], Button: Ui['Button'], onPress: () => unknown, onStop: () => unknown) => {
    const left = w.limit - w.elapsed
    return (
      <Box key={`w${w.pid}`} flexDirection="column">
        <Box flexDirection="row">
        {/* 停止放在行首、指针移上这一行才露出来（外层带 key 的 Box 是悬停范围，界面自己处理、不过插件）。
            ✕ 的 2 格平时也占着：露不露都不推后面，各行行首对齐。只能用指针点：键盘聚焦不触发悬停 */}
        <Box width={2}>
          {ended(w) ? null : (
            <Box display="none" hover={{ display: 'flex' }}>
              <Button key={`k${w.pid}`} plain onPress={onStop}>
                <Text color="error">✕</Text>
              </Button>
            </Box>
          )}
        </Box>
        <Button key={`b${w.pid}`} plain onPress={onPress}>
          {glyph(w)}
          <Text> {padTo(w.title, 18)}</Text>
          {wave(w)}
          <Text>  </Text>
          {parked(w) ? null : hasPct(w) ? <Text color="success">{w.pct}%</Text> : time(w)}
          {why(w)}
          {w.limit > 0 && !ended(w) && left < w.limit / 5 ? <Text color="error">  离上限 {left}s</Text> : null}
          <Text dimColor>  {isOpen ? '▾' : '▸'}</Text>
        </Button>
        </Box>
        {isOpen ? (
          <Box flexDirection="column">
            {errLine(w) ? <Text color="error">   │ {errLine(w)}</Text> : null}
            {w.tail.map((l, i) => <Text key={`t${i}`} dimColor>   │ {l}</Text>)}
            <Text dimColor>   └ {w.log}</Text>
          </Box>
        ) : null}
      </Box>
    )
  }

  return { glyph, time, wave, why, row }
}
