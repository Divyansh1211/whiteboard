"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";

export default function Home() {
  return (
    <div className="text-4xl font-bold text-center">
      <h1>Realtime Note Editor</h1>
      <NoteEditor noteId="1" />
    </div>
  );
}

const socket = io("http://localhost:5000");

function NoteEditor({ noteId }: { noteId: string }) {
  const [content, setContent] = useState("");

  useEffect(() => {
    socket.emit("join-room", noteId);

    socket.emit("get-note", noteId);

    socket.on("update-note", (updatedContent) => {
      setContent(updatedContent);
    });

    return () => {
      socket.disconnect();
    };
  }, [noteId]);

  const handleEdit = (e: any) => {
    setContent(e.target.value);
    socket.emit("edit-note", noteId, e.target.value);
  };

  return <textarea value={content} onChange={handleEdit} />;
}
