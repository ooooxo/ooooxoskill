// wait-band 状态条里那颗转的星标（surface 模块）：在界面那边按帧转，不跟插件每秒一次的轮询
// 怎么跑：register.tsx 每格画一个 <Client module="./spin.tsx" props={{ tone, phase }} width={1} />；只管转，点按交给旁边的 Button（Button 才算人按的，窄屏开得了 /w）
// 需要：tone 是主题色名（claude / error / warning），phase 让几颗不同步
import type { ClientModule } from 'claude-code'

type Props = { tone: string; phase: number }

// Claude Code 自己那颗的帧
const FR = ['·', '✢', '✳', '✶', '✻', '✽', '✻', '✶', '✳', '✢']
const TICK_MS = 250 // 120ms（Claude Code 自己的节奏）在格子里嫌快：好几颗一起转太躁

const Spin: ClientModule<Props, { f: number }> = (p, s) => {
  const { Text } = s.elements
  if (s.state === undefined) {
    s.setState({ f: 0 })
    // 窗口不在前台、要求少动效时不推帧
    s.every(TICK_MS, () => {
      if (s.isWindowFocused && !s.isMotionReduced) s.setState({ f: (s.state?.f ?? 0) + 1 })
    })
  }
  return <Text color={p.tone}>{FR[((s.state?.f ?? 0) + p.phase * 3) % FR.length]}</Text>
}

export default Spin
