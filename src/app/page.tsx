/* eslint-disable react/no-unescaped-entities */
"use client";

import { Suspense, useMemo } from "react";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import NoSleep from "nosleep.js";
import { useSearchParams } from "next/navigation";
import useAlphaTimingSystem from "@/hooks/useAlphaTimingSystem";
import clsx from "clsx";
import { formatTime } from "@/utils/formatTime";
import { useTimer } from "react-use-precision-timer";
import tracks from "./tracks.json";
import useGeolocation from "react-hook-geolocation";

import { findClosestTrack } from "@/utils/findClosestTrack";
import { ItemSelectTrack, ItemSelectDriver } from "@/components/ItemSelect";

const Client = () => {
  const [isFullScreen, setIsFullScreen] = useState<Boolean>(false);
  const keepScreenOn = useRef<NoSleep>();
  const audio = useRef<HTMLAudioElement>(null);

  const queryParams = useSearchParams();
  const [track, setTrack] = useState<string>(queryParams.get("track") || "");
  const [driverName, setDriverName] = useState<string>(
    queryParams.get("driver") || "",
  );

  let locationPermissions = useRef<boolean>(true);

  const geolocation = useGeolocation(
    {
      enableHighAccuracy: false,
    },
    () => {},
    locationPermissions.current,
  );

  useEffect(() => {
    if (!track && geolocation.latitude && geolocation.longitude) {
      const closestTrack = findClosestTrack(
        geolocation.latitude,
        geolocation.longitude,
        tracks,
      );

      if (closestTrack) {
        setTrack(closestTrack);
        history.pushState({}, "", `?track=${closestTrack}`);
      } else {
        setTrack(queryParams.get("track") || "");
      }
    } else {
      locationPermissions.current = false;
    }
  }, [geolocation]);

  const {
    race_competitors,
    driverEvent,
    display: {
      lapTime,
      topThreeLaps = [],
      gap,
      gapBehind,
      bestLapTime,
      currentLapNumber,
      position,
    } = {},
  } = useAlphaTimingSystem(track, driverName);

  const [newBest, setNewBest] = useState<boolean>(false);
  const [time, setTime] = useState<number>(0);
  // The callback will be called every 1000 milliseconds.
  const timer = useTimer({ delay: 10 }, () => {
    const timePassed = timer.getElapsedResumedTime();
    if (timePassed > 59 * 1000) {
      // reInitWebsocketConnection()
      // location.reload()
      timer.start();
    }

    setTime(timePassed);
  });

  useEffect(() => {
    if (!driverName) return;
    // allow for timer to start when competitor name is set
    // or restart when new lap time is reported

    timer.start();
  }, [driverName, lapTime]);

  useEffect(() => {
    if (driverEvent === "new_best_lap") {
      setNewBest(true);
      audio.current?.play();
    } else if (driverEvent === "finished_race") {
      timer.stop();
      return;
    }
  }, [driverEvent]);

  const handleFullscreen = () => {
    setIsFullScreen(Boolean(document.fullscreenElement));

    if (!keepScreenOn.current) {
      keepScreenOn.current = new NoSleep();
    }

    if (!keepScreenOn.current.isEnabled) {
      keepScreenOn.current.enable();
      // @ts-ignore
      screen.orientation.lock("landscape");
    } else {
      keepScreenOn.current.disable();
    }
  };

  // handle full screen events
  useEffect(() => {
    document.addEventListener("fullscreenchange", handleFullscreen);

    const mainElement = document.querySelector("main");
    if (mainElement) {
      mainElement.addEventListener("transitionend", () => setNewBest(false));
    }

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreen);

      if (mainElement) {
        mainElement.removeEventListener("transitionend", () =>
          setNewBest(false),
        );
      }
    };
  }, []);

  const competitorSelected = (selectedDriver: string) => {
    const id = race_competitors.findIndex(
      (competitor: any) =>
        competitor["CompetitorId"] === parseInt(selectedDriver),
    );
    const competitor = race_competitors[id];
    if (!competitor) return;

    setDriverName(competitor?.["CompetitorName"]);

    history.pushState(
      {},
      "",
      `?track=${track}&driver=${competitor?.["CompetitorName"]}`,
    );
  };

  const selectTrack = (selectedTrack: string) => {
    if (track === selectedTrack) return;

    setTrack(selectedTrack);
    clearDriver();
    history.pushState({}, "", `?track=${selectedTrack}`);
  };

  const clearDriver = () => {
    setDriverName("");
    timer.stop();
    setTime(0);
  };

  return (
    <main
      className={clsx({
        "flex h-full flex-col transition-colors duration-500": true,
        "bg-green-700": newBest,
      })}
    >
      <div className="mx-5 flex items-center justify-end gap-5 font-mono">
        <audio ref={audio} src="./sounds/ding_sound.mp3" />
        {!isFullScreen && (
          <button
            className="mt-3 whitespace-nowrap rounded bg-blue-500 py-2 pl-4 pr-7 font-bold text-white hover:bg-blue-700 md:hidden"
            onClick={() => document.documentElement.requestFullscreen()}
          >
            <span>Drive Mode</span>{" "}
            <img
              className="mb-0.5 inline"
              src="./steering.svg"
              width="20"
              height="20"
              alt="My Happy SVG"
            />
          </button>
        )}

        {/* <div className="flex justify-around font-mono grow gap-10 max-sm:hidden">
          <div className="font-bold flex gap-3 text-3xl">
            <span>BLT:</span>
            <span>{ formatTime(bestLapTime !== Infinity ? bestLapTime : 0) }</span>
          </div>
          <div className="font-bold flex gap-3 text-3xl">
            <span>Gap:</span>
            <span>{ gap }</span>
          </div>
          <div className="font-bold flex gap-3 text-3xl">
            <span>Beh:</span>
            <span>{ gapBehind }</span>
          </div>
        </div> */}
        <div className="flex max-sm:hidden">
          <div>
            <span className="mt-2.5 text-5xl">L</span>
            <span className="text-6xl">{currentLapNumber}</span>
          </div>
          <div>
            <span className="mb-1 text-5xl">P</span>
            <span className="text-6xl">{position}</span>
          </div>
        </div>
      </div>
      <div className="flex justify-center font-mono max-sm:my-16 md:mt-4">
        <span className="font-mono text-9xl max-sm:text-8xl">
          {time < 5000 && lapTime !== 0
            ? formatTime(lapTime)
            : formatTime(time)}
        </span>
      </div>
      <div className="mx-5 flex max-sm:grow max-sm:flex-col">
        <div className="basis-3/4 max-sm:basis-2/4">
          <span>Top Laps:</span>
          <div className="flex flex-col items-center max-sm:mt-4">
            {topThreeLaps.map(({ time, lap }: any, index: number) => {
              if (time === Infinity) return;

              return (
                <div className="flex font-mono" key={`${index}-${time}`}>
                  <span className="text-5xl">{formatTime(time)}</span>
                  <div className="self-end pl-3">
                    <span>L{lap}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex grow flex-col justify-evenly md:hidden">
          <div>
            <ItemSelectTrack
              value={track}
              tracks={tracks}
              onChange={selectTrack}
            />
          </div>
          <div>
            <ItemSelectDriver
              value={driverName}
              drivers={race_competitors}
              onChange={competitorSelected}
            />
          </div>
        </div>

        <div className="stats mr-5 flex basis-1/4 flex-col items-center font-mono max-sm:hidden">
          <span className="invisible">Stats:</span>
          <div>
            <div className="flex justify-between gap-3 text-5xl">
              <span>Gap:</span>
              <span>{gap}</span>
            </div>
            <div className="flex justify-between gap-3 text-5xl">
              <span>Beh:</span>
              <span>{gapBehind}</span>
            </div>
            <div className="flex justify-between gap-3 text-5xl">
              <span>BLT:</span>
              <span>
                {formatTime(bestLapTime !== Infinity ? bestLapTime : 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default function Home() {
  return (
    <Suspense>
      <Client />
    </Suspense>
  );
}
