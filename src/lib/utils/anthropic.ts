import { IMessage } from "@/types";

export const prepareMessagesForPost = (messages: IMessage[]) => {
    return messages.map((message) => ({
        role: message.role,
        content: message.content,
    }));
};