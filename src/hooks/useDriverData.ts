import useAlphaTimerWebsocket from "@/hooks/useAlphaTimerWebsocket"
import { useEffect, useState } from "react"

export default (track: string, driverName: string) => {
  const [competitors, setCompetitors] = useState([])
  const [bestLap, setBestLap] = useState<number>(0)
  const {
      startCommunication,
      reInitWebsocketConnection,
      addPreviousBestLap,
      calculateBestOverallLaptime,
      result: {
          driverEvent,
          lastLapTime,
          previousBestLaps,
          gap,
          gapBehind,
          bestOverallLaptime,
          currentLapNumber,
          position,
      },
      setters: {
          setGap,
          setCurrentLapNumber,
          setPosition,
      }
  } = useAlphaTimerWebsocket(track, driverName)

  // PORTED
  const getCurrentCompetitionData = async () => {
      if (!track) return

      const response = await fetch(`https://live.alphatiming.co.uk/${track}.json`)

      const raceSetup = await response.json()

      setCompetitors(raceSetup['Competitors'])
      calculateBestOverallLaptime(raceSetup['Competitors'])

      return raceSetup['Competitors']
  }

  useEffect(() => {
    getCurrentCompetitionData()
  }, [track])

  // communicate with socket when we have the driver details
  useEffect(() => {
    if (!driverName || !track || !competitors.length) return

    const competitor = competitors.find((competitor: any) => competitor['CompetitorName'] === driverName)

    // initialise driver screen with data already recorded - this can be used in case the page refreshes
    if (competitor?.['Gap']) setGap(competitor['Gap'])
    if (competitor?.['NumberOfLaps']) setCurrentLapNumber(competitor['NumberOfLaps'])
    if (competitor?.['Position']) setPosition(competitor['Position'])
    if (competitor?.['BestLaptime'] && competitor?.['BestLapNumber']) {
        addPreviousBestLap({
            time: competitor['BestLaptime'],
            lap: competitor['BestLapNumber'],
        })
    }

    startCommunication(competitor)
  }, [driverName, competitors])

  useEffect(() => {
    if (bestLap !== previousBestLaps[0].lap) {
      setBestLap(previousBestLaps[0].lap)
    }
  }, [previousBestLaps])

  return {
    reInitWebsocketConnection,
    raceCompetitors: competitors,
    driver: {
        driverEvent,
        lastLapTime,
        newBestLap: bestLap,
        previousBestLaps,
        gap,
        gapBehind,
        bestOverallLaptime,
        currentLapNumber,
        position,
    }
  }
}