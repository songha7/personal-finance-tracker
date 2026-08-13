"use client";

import { useEffect, useState } from "react";

const Weather = () => {
  const [temp, setTemp] = useState(null);

  useEffect(() => {
    fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=51.5074&longitude=-0.1278&current=temperature_2m"
    )
      .then((res) => res.json())
      .then((data) => setTemp(data.current.temperature_2m));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-display">London temp now</h1>
      <p className="text-5xl font-semibold">{temp}°C</p>
    </div>
  );
};

export default Weather;
