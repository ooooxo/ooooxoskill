import * as signalR from "@microsoft/signalr";

export const connection = new signalR.HubConnectionBuilder().withUrl("/hubs/chat").build();

export function onTodoChanged(handler: (id: number) => void) {
  connection.on("todoChanged", handler);
}

export function onMessage(handler: (user: string, text: string) => void) {
  connection.on("ReceiveMessage", handler);
}

export const say = (user: string, text: string) => connection.invoke("SendMessage", user, text);
