// waitfor 每秒写的一份状态（/tmp/waitfor/p<Claude 进程号>/<pid>.json），字段名照 ~/.claude/tools/waitfor 的 status()
export type Wait = {
  /** -l：稳定的内部 id，往常耗时按它记、后台任务按它认 */
  label: string
  /** -t：给人看的短标题；没给就是 label */
  title: string
  cmd: string
  pid: number
  /** 后台跑的（插件按 -l 对上 run_in_background 的命令认出来）：只有它们卡住才叫 agent，前台的 agent 自己在等 */
  bg: boolean
  /** -p：挂着等人 */
  park: boolean
  started: number
  elapsed: number
  /** 0 = 不设上限 */
  limit: number
  /** 同标签最近五次成功的中位耗时（秒）；头一回是 null */
  usual: number | null
  /** 真进度：命令自己在最近几行报的 [n/m] 或 n%；没报是 null */
  pct: number | null
  quiet: number
  /** 静这么久算卡住；0 = 不判 */
  quietMax: number
  /** loop = 同一条报错反复出现（重试死循环）：一直有输出但没进展，和 stuck 一样叫 agent */
  /** park = -p 挂着等人（长轮询）：不判卡住、不叫 agent，画成绿色「◌」= 等你处理 */
  state: 'run' | 'quiet' | 'stuck' | 'loop' | 'park' | 'err' | 'ok' | 'fail'
  errs: number
  err: string
  /** 循环的那条报错出现了几次；没循环是 0 */
  loopN: number
  loopErr: string
  last: string
  log: string
  /** 最近 30 秒每秒的输出行数，最新的在末尾 */
  wave: number[]
  /** 终态：waitfor 的退出码（跑到结束那种失败时是命令自己的退出码） */
  code: number | null
  ended: number | null
}

export type Row = Wait & { file: string; tail: string[] }

declare module 'claude-code' {
  interface PluginState {
    'wait-band': { waits: Row[]; open: number[]; bg: { cmd: string; at: number }[] }
  }
}
