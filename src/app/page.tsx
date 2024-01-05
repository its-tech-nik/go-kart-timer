/* eslint-disable react/no-unescaped-entities */
'use client';

import { ChangeEvent, useEffect, useRef, useState, useCallback } from "react";
import NoSleep from 'nosleep.js';
import { useSearchParams } from "next/navigation";
import useAlphaTimerWebsocket from "@/hooks/useAlphaTimerWebsocket";
import clsx from "clsx";
import { formatTime } from "@/utils/formatTime";
import { useTimer } from 'react-use-precision-timer';

export default function Home() {
  const [queryParameters] = useSearchParams()
  const [driverName, setDriverName] = useState<string>('')
  const { startMessaging, reInitWebsocketConnection, result: {lastLapTime, position, previousBestLaps, gap, bestOverallLaptime, currentLapNumber} } = useAlphaTimerWebsocket(queryParameters?.[1] || driverName)
  const [ isFullScreen, setIsFullScreen] = useState<Boolean>(false)
  const [bestLap, setBestLap] = useState<number>(0)
  const [newBest, setNewBest] = useState<boolean>(false)
  const [competitors, setCompetitors] = useState([])
  const audio = useRef<HTMLAudioElement>(null)
  const keepScreenOn = useRef<NoSleep>()
  const [time, setTime] = useState<number>(0)

  // The callback will be called every 1000 milliseconds.
  const timer = useTimer({ delay: 10 }, () => {
    const timePassed = timer.getElapsedResumedTime()
    if (timePassed > 10 * 1000) {
      // console.log(competitors)
      reInitWebsocketConnection()
      timer.start()
    }

    setTime(timePassed)
  });

  const getCompetitionInformation = () => {

    fetch('https://live.alphatiming.co.uk/qleisure.json')
    .then(async (results) => {
      const raceSetup = await results.json()

      if (queryParameters && queryParameters[0] === 'driver_name') {
        const competitor = raceSetup['Competitors'].find((competitor: any) => competitor['CompetitorName'] === queryParameters[1])

        if (competitor) startMessaging(competitor)
      }

      console.log(raceSetup['Competitors'])
      setCompetitors(raceSetup['Competitors'])
    })
  }

  useEffect(() => {
    timer.start();
  }, [lastLapTime])

  useEffect(() => {
    if (queryParameters && queryParameters[0] === 'driver_name') {
      setDriverName(queryParameters[1])
    }

    getCompetitionInformation()

    document.addEventListener('fullscreenchange', () => {
      setIsFullScreen(Boolean(document.fullscreenElement))

      if (!keepScreenOn.current) {
        keepScreenOn.current = new NoSleep()
      }

      if (!keepScreenOn.current.isEnabled) {
        keepScreenOn.current.enable();
      } else {
        keepScreenOn.current.disable();
      }
    })

    const mainElement = document.querySelector('main')
    mainElement?.addEventListener('transitionend', () => setNewBest(false))

    timer.start()
  }, [])

  useEffect(() => {
    if (bestLap !== previousBestLaps[0].lap) {
      setBestLap(previousBestLaps[0].lap)
      setNewBest(true)
      audio.current?.play()
    }
  }, [previousBestLaps])

  const competitorSelected = (event: ChangeEvent<HTMLSelectElement>) => {
    const competitor = competitors.find(competitor => competitor['CompetitorId'] === parseInt(event.target?.value))

    startMessaging(competitor)

    history.pushState({}, '', `?driver_name=${competitor?.['CompetitorName']}`)

    setDriverName(competitor?.['CompetitorName'] || '')
  }

  const clearDriverName = () => setDriverName('')

  return (
    <main className={clsx({
      'h-full flex flex-col transition-colors duration-500': true,
      'bg-green-700' : newBest,
    })}>
      <div className="flex justify-between">
        <audio ref={audio} src="./sounds/ding_sound.mp3" />
        {!isFullScreen && <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={() => document.documentElement.requestFullscreen()}>Fullscreen</button>}
        <div>
          <span>Driver's Name: </span>
          { driverName ? <span onClick={clearDriverName} className="pe-3">{ driverName }</span> : (
            <select onChange={competitorSelected} className="bg-green-600">
              <option value="">Select Driver</option>
              {competitors.map((competitor, index) => {
                return (
                  <option key={index} value={competitor['CompetitorId']}>{competitor['CompetitorName']}</option>
                )
              })}
            </select>
          )}
        </div>
      </div>
      <div className="flex justify-center font-mono">
        <span className="text-9xl">{ time < 5000 && lastLapTime !== 0 ? formatTime(lastLapTime) : formatTime(time) }</span>
      </div>
      <div className="flex grow mt-3">
        <div className="previous-laps basis-3/4">
          <span className="pl-9">Best Laps:</span>
          <div className="flex flex-col items-center">
            { previousBestLaps.map(({ time, lap }: any, index: number) => {

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
          <div className="font-bold grow text-3xl">
            <span>Gap: { gap }</span>
          </div>
          <div className="font-bold grow text-3xl">
            <span>BOL: { formatTime(bestOverallLaptime !== Infinity ? bestOverallLaptime : 0) }</span>
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
