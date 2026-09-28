import mitt from "mitt";

// 应用内事件总线（不是服务端推送）
export const bus = mitt<{ update: number; message: string }>();
