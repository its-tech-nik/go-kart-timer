import React, { useEffect, useRef, useState } from 'react'
import useWebSocket from 'react-use-websocket';

const useAlphaTimerWebsocket = (competitorName: string) => {
    // const { sendJsonMessage, lastJsonMessage } = useWebSocket('ws://localhost:443')
    const { sendJsonMessage, lastJsonMessage, getWebSocket } = useWebSocket('wss://ws-eu.pusher.com/app/3aaffebc8193ea83cb2f?protocol=7&client=js&version=3.1.0&flash=false')

    const [driver, setDriver] = useState({
        id: null,
        name: null,
        lastLapTime: "00.000",
        front: 0,
        back: 0,
        currentLap: 0,
        previousBestLaps: [
            {
                time: {
                    value: Infinity,
                    display: "00.000",
                },
                lap: 0,
            },
            {
                time: {
                    value: Infinity,
                    display: "00.000",
                },
                lap: 0,
            },
            {
                time: {
                    value: Infinity,
                    display: "00.000",
                },
                lap: 0,
            },
        ] as any,
        position: 0,
    })

    const lastRecordedSequenceNumber = useRef<number>(-1)
    const lastRecordedLapNumber = useRef<number>(-1)

    const startMessaging = (competitor: any) => {
        setDriver({
            ...driver,
            id: competitor['CompetitorId'],
            name: competitor['CompetitorName'],
        })

        sendJsonMessage({
            event: "pusher:subscribe",
            data: { channel: "qleisureprod" }
        })
    }

    const testForNoMissingPackets = (sequence: number) => {
        if (sequence === 1) lastRecordedSequenceNumber.current = 1

        if (lastRecordedSequenceNumber.current < 0)
            lastRecordedSequenceNumber.current = sequence

        return sequence !== lastRecordedSequenceNumber.current++
    }

    const testForNoMissingLaps = (lap: number) => {
        if (lap === 1) lastRecordedLapNumber.current = 1

        if (lastRecordedLapNumber.current < 0)
            lastRecordedLapNumber.current = lap

        return lap !== lastRecordedLapNumber.current++
    }

    useEffect(() => {

        const sd = null

        if (lastJsonMessage) {
            const { data, event } = lastJsonMessage as any

            if ((event === 'update' || event === 'new_session' || event === 'updated_session') && data) {
                const dataJson = JSON.parse(data)

                if (event === 'new_session') console.log('NEW SESSION')
                else if (event === 'updated_session') console.log('UPDATED SESSION')
        
                if (dataJson['Sequence'] && testForNoMissingPackets(dataJson['Sequence'])) throw new Error(`Missing Packet: ${dataJson['Sequence']}`)
            
                if (dataJson['Competitors']) {
                    const competitors = dataJson['Competitors']

                    for (let i=0; i < competitors.length; i++) {
                        // show data for the session selected (10m or 20m) or show all if class is not selected
                        if (dataJson['SD'] !== sd && sd) continue

                        const competitor = competitors[i]

                        if (competitor['Laps'] && competitor['Laps'][0]['Position'] === driver.position + 1) {
                            setDriver({
                                ...driver,
                                back: competitor['Laps'][0]['Gap'] || driver.back,
                            })
                        }

                        // Grab the competitorId associated with the CompetitorName
                        if (competitor['CompetitorName'] && competitor['CompetitorName'] === competitorName) {
                            setDriver({...driver, id: competitor['CompetitorId']})
                        }
                        // show data only for selected competitor using its ID
                        if (competitor['CompetitorId'] === driver.id) {

                            if (competitor['NumberOfLaps'] && testForNoMissingLaps(competitor['NumberOfLaps'])) throw new Error(`Missing Lap: ${competitor['NumberOfLaps']}`)
                            
                            if (competitor['Laps']) {
                                const lap = competitor['Laps'][0]

                                setDriver({
                                    ...driver,
                                    front: lap['Gap'] || driver.front,
                                    currentLap: lap['LapNumber'] || driver.currentLap,
                                    position: lap['Position'] || driver.position,
                                    lastLapTime: lap['LapTime'] ? (lap['LapTime'] / 1000).toFixed(3) : driver.lastLapTime,
                                    previousBestLaps: lap['LapTime'] && lap['LapTime'] < driver.previousBestLaps[2].time.value ? [
                                        driver.previousBestLaps[0],
                                        driver.previousBestLaps[1],
                                        {
                                            time: {
                                                value: lap['LapTime'],
                                                display: (lap['LapTime'] / 1000).toFixed(3),
                                            },
                                            lap: competitor['NumberOfLaps'],
                                        }
                                    ].sort((a, b) => a.time.value - b.time.value) : driver.previousBestLaps,
                                })
                            }
                        }
                    }
                }

            }
        }
    }, [lastJsonMessage])

    return {
        startMessaging,
        result: driver
    }
}

export default useAlphaTimerWebsocket