import { prismaClient } from "db";
import { del, set } from "./network";
import { io } from ".";

export async function handleLeaveRoom(
  roomId: string,
  userId: string,
  whiteboardData: string,
  title: string
) {
  console.log("title", title);
  const whiteboardParsedData = JSON.stringify(whiteboardData);
  try {
    const existWhiteboard = await prismaClient.whiteboard.findFirst({
      where: {
        ownerId: userId,
        canvasId: roomId,
      },
    });
    if (existWhiteboard) {
      await prismaClient.whiteboard.update({
        where: {
          id: existWhiteboard.id,
        },
        data: {
          data: whiteboardParsedData,
          title,
          lastModified: new Date(),
        },
      });
      console.log("Whiteboard updated");
    } else {
      await prismaClient.whiteboard.create({
        data: {
          title,
          data: whiteboardParsedData,
          canvasId: roomId,
          ownerId: userId,
          thumbnail: "",
        },
      });
      console.log("Whiteboard saved");
    }
  } catch (e) {
    console.error("Error saving whiteboard", e);
  }
}

export async function handleClearWhiteBoard(roomId: string) {
  const emptyCanvas = {
    version: "6.6.1",
    objects: [],
  };

  io.to(roomId).emit(
    "update-whiteboard",
    roomId,
    "userId",
    JSON.stringify(emptyCanvas)
  );
  await del(roomId);
}

export async function handleUpdateWhiteBoard(
  roomId: string,
  userId: string,
  data: string
) {
  io.to(roomId).emit("update-whiteboard", roomId, userId, data);
  await set(roomId, data);
}

export async function handleClearNote(roomId: string) {
  io.to(roomId).emit("update-note", "");
  await del(roomId);
}

export async function handleEditNote(roomId: string, data: string) {
  io.to(roomId).emit("update-note", data);
  await set(roomId, data);
}
