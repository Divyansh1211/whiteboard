"use client";

import axios from "axios";
import { LandingPage } from "../../components/LandingPage";
import { useEffect, useState } from "react";
import { BACKEND_URL } from "../config";

export const handleDelete = async (
  id: string,
  e: React.MouseEvent<HTMLButtonElement>
) => {
  e.stopPropagation();
  await axios.post(
    `${BACKEND_URL}/whiteboard/delete`,
    {
      id: id,
    },
    {
      headers: {
        Authorization: localStorage.getItem("token"),
      },
    }
  );
  location.reload();
};

async function fetchDrawings() {
  const res = await axios.get(`${BACKEND_URL}/whiteboard`, {
    headers: {
      Authorization: localStorage.getItem("token"),
    },
  });
  return res.data;
}

export default function Gallery() {
  const [drawings, setDrawings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const drawings = await fetchDrawings();
      setDrawings(drawings);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className=" mx-auto p-8">
        <LandingPage drawings={drawings} loading={loading} />
      </div>
    </div>
  );
}
