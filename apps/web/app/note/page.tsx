"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

export default function NoteEditor() {
  const [content, setContent] = useState("");
  const params = useSearchParams();
  const noteId = params.get("noteId");

  useEffect(() => {
        console.log("Joining room", noteId);
        socket.emit("join-room", noteId);
        socket.emit("get-note", noteId);
        socket.on("update-note", (updatedContent) => {
          setContent(updatedContent);
        });
        return () => {
          socket.disconnect();
        };
  }, []);

  const handleEdit = (e: any) => {
    setContent(e.target.value);
    socket.emit("edit-note", noteId, e.target.value);
  };

  return (
    <div>
      <textarea value={content} onChange={handleEdit} />;
      <button onClick={() => socket.emit("clear-note", noteId)}>Clear</button>
    </div>
  );
}
