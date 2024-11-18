/* eslint-disable react/no-unescaped-entities */
'use client';

import { ChangeEvent, useEffect, useRef, useState, useCallback } from "react";
import NoSleep from 'nosleep.js';
import { useSearchParams } from "next/navigation";
import useAlphaTimingSystem from "@/hooks/useAlphaTimingSystem"
import clsx from "clsx";
import { formatTime } from "@/utils/formatTime";
import { useTimer } from 'react-use-precision-timer';
import tracks from './tracks.json'

export default function Home() {
  const [isFullScreen, setIsFullScreen] = useState<Boolean>(false)
  const keepScreenOn = useRef<NoSleep>()
  const audio = useRef<HTMLAudioElement>(null)

  const queryParams = useSearchParams()
  const [track, setTrack] = useState<string>(queryParams.get('track') || '')
  const [driverName, setDriverName] = useState<string>(queryParams.get('driver') || '')

 const trackCodeToName = (code: string) => {
  return tracks.find(track => track.code === code)?.track_name
 }

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
  } = useAlphaTimingSystem(track, driverName)

  const [newBest, setNewBest] = useState<boolean>(false)
  const [time, setTime] = useState<number>(0)
  // The callback will be called every 1000 milliseconds.
  const timer = useTimer({ delay: 10 }, () => {
    const timePassed = timer.getElapsedResumedTime()
    if (timePassed > 59 * 1000) {
      // console.log(competitors)
      // reInitWebsocketConnection()
      // location.reload()
      timer.start()
    }

    setTime(timePassed)
  });

  useEffect(() => {
    if (!driverName) return
    // allow for timer to start when competitor name is set
    // or restart when new lap time is reported

    timer.start();

  }, [driverName, lapTime])

  useEffect(() => {
    if (driverEvent === 'new_best_lap') {
      setNewBest(true)
      audio.current?.play()
    } else if (driverEvent === 'finished_race') {
      timer.stop()
      return
    }

  }, [driverEvent])

  const handleFullscreen = () => {
    setIsFullScreen(Boolean(document.fullscreenElement))

    if (!keepScreenOn.current) {
      keepScreenOn.current = new NoSleep()
    }

    if (!keepScreenOn.current.isEnabled) {
      keepScreenOn.current.enable();
      // @ts-ignore
      screen.orientation.lock('landscape')
    } else {
      keepScreenOn.current.disable();
    }
  }

  useEffect(() => {
    document.addEventListener('fullscreenchange', handleFullscreen)

    const mainElement = document.querySelector('main')
    if (mainElement) {
      mainElement.addEventListener('transitionend', () => setNewBest(false))
    }

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreen)

      if (mainElement) {
        mainElement.removeEventListener('transitionend', () => setNewBest(false))
      }
    }
  }, [])

  const competitorSelected = (event: ChangeEvent<HTMLSelectElement>) => {
    const competitor = race_competitors[parseInt(event.target.value)]
    if (!competitor) return

    setDriverName(competitor?.['CompetitorName'])

    history.pushState({}, '', `?track=${track}&driver=${competitor?.['CompetitorName']}`)
  }

  const clearTrackSelection = () => {
    clearDriver()
    setTrack('')
  }

  const selectTrack = (event: ChangeEvent<HTMLSelectElement>) => {
    setTrack(event.target.value)
    setDriverName('')
    history.pushState({}, '', `?track=${event.target.value}`)
  }

  const clearDriver = () => {
    setDriverName('')
    timer.stop()
    setTime(0)
  }

  return (
    <main className={clsx({
      'h-full flex flex-col transition-colors duration-500': true,
      'bg-green-700' : newBest,
    })}>
      <div className="flex gap-3">
        <audio ref={audio} src="./sounds/ding_sound.mp3" />
        {!isFullScreen && <button className="md:hidden bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded place-self-stretch" onClick={() => document.documentElement.requestFullscreen()}>Fullscreen</button>}
        <div className="col-start-3">
          <span>Track: </span>
          {track ? (
              <span onClick={clearTrackSelection}>{trackCodeToName(track)}</span>
            ) : (
              <select onChange={selectTrack} className="bg-green-600 w-40">
                <option value="">Select Track</option>
                {tracks.map(({ code, track_name }) => {
                  return (
                    <option key={code} value={code}>{track_name}</option>
                  )
                })}
              </select>
            )
          }
        </div>
        {track && <div>
          <span>Driver: </span>
          { driverName ? (
              <span onClick={clearDriver} className="pe-3">{ driverName }</span>
            ) : (
              <select onChange={competitorSelected} className="bg-green-600 w-40">
                <option value="">Select Driver</option>
                {race_competitors.map((competitor, index) => {
                  return (
                    <option key={competitor['CompetitorId']} value={index}>{competitor['CompetitorName']}</option>
                  )
                })}
              </select>
            )
          }
        </div>}
      </div>
      <div className="flex justify-center font-mono">
        <span className="max-sm:text-8xl text-9xl">{ time < 5000 && lapTime !== 0 ? formatTime(lapTime) : formatTime(time) }</span>
      </div>
      <div className="flex max-sm:flex-col grow mt-3">
        <div className="max-sm:basis-2/4 basis-3/4">
          <span className="pl-9">Best Laps:</span>
          <div className="flex flex-col items-center">
            { topThreeLaps.map(({ time, lap }: any, index: number) => {

              if (time === Infinity) return

              return (
                <div className="flex font-mono" key={`${index}-${time}`}>
                  <span className="text-5xl">{ formatTime(time) }</span>
                  <div className="pl-3 self-end">
                    <span>L{ lap }</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <div className="stats flex basis-1/4 flex-col items-center font-mono">
          <div className="font-bold w-full grow flex gap-3 justify-between text-3xl mr-5">
            <span>Gap:</span>
            <span>{ gap }</span>
          </div>
          <div className="font-bold w-full grow flex gap-3 justify-between text-3xl mr-5">
            <span>Beh:</span>
            <span>{ gapBehind }</span>
          </div>
          <div className="font-bold w-full grow flex gap-3 justify-between text-3xl mr-5">
            <span>BLT:</span>
            <span>{ formatTime(bestLapTime !== Infinity ? bestLapTime : 0) }</span>
          </div>
          <div className="flex gap-3">
            <div>
              <span className="mt-2.5 text-5xl">L</span>
              <span className="text-6xl">{ currentLapNumber }</span>
            </div>
            <div>
              <span className="mb-1 text-5xl">P</span>
              <span className="text-6xl">{ position }</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
