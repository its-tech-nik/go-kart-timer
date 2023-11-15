import React, { useEffect, useInsertionEffect, useRef, useState } from 'react'
import useWebSocket, { ReadyState } from 'react-use-websocket';

const useAlphaTimerWebsocket = (competitorName: string) => {
    const { sendJsonMessage, lastJsonMessage, getWebSocket } = useWebSocket('wss://ws-eu.pusher.com/app/3aaffebc8193ea83cb2f?protocol=7&client=js&version=3.1.0&flash=false')

    const [driver, setDriver] = useState({
        id: null,
        name: null,
        sessionId: null,
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

    const startMessaging = (competitor: any) => {
        console.log(competitor)
        setDriver({
            ...driver,
            id: competitor['CompetitorId'],
            name: competitor['CompetitorName'],
            // sessionId: compData['SessionId']
        })

        sendJsonMessage({
            event: "pusher:subscribe",
            data: { channel: "qleisureprod" }
        })
    }

    useEffect(() => {
        if (competitorName) {
            sendJsonMessage({
                event: "pusher:subscribe",
                data: { channel: "qleisureprod" }
            })
        }

        return () => {
            getWebSocket()?.close()
        }
    }, [])

    useEffect(() => {
        if (!lastJsonMessage) return

        if (!lastJsonMessage?.data) return

        try {
            // const asdf = JSON.parse(lastJsonMessage.data)
            // console.log('last', lastJsonMessage)
            const compData = JSON.parse(lastJsonMessage.data)
    
            // console.log(compData)

            if (compData['State'] === 'Ended') getWebSocket()?.close()

            if (compData['Competitors']?.length) {
                console.log('competitor.length', driver)
                const competitors = compData['Competitors']

                for (let i=0; i < competitors.length; i++) {
                    const competitor = competitors[i]
                    if (competitor['CompetitorId'] === 72165) console.log({competitor})

                    if (competitor['Laps'] && competitor['Laps'][0]['Position'] === driver.position + 1) {
                        setDriver({
                            ...driver,
                            back: competitor['Laps'][0]['Gap'],
                        })
                    }
    
                    if (competitor['CompetitorName'] && competitor['CompetitorName'] === competitorName) {

                        setDriver({
                            ...driver,
                            id: competitor['CompetitorId'],
                            name: competitor['CompetitorName'],
                            sessionId: compData['SessionId']
                        })
                        console.log('new_driver', driver)
                    } else if (!driver.sessionId) {
                        console.log('asdf')
                        setDriver({
                            ...driver,
                            sessionId: compData['SessionId']
                        })
                    }
                    else if (!competitor['CompetitorName'] && competitor['el'] && competitor['CompetitorId'] === driver.id && compData['SessionId'] === driver.sessionId) {
                        const lap = competitor['Laps'][0]

                        console.log(lap)

                        setDriver({
                            ...driver,
                            front: lap['Gap'],
                            previousBestLaps: lap['LapTime'] < driver.previousBestLaps[2].time.value ? [
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
                            lastLapTime: (lap['LapTime'] / 1000).toFixed(3),
                            position: lap['Position'],
                            currentLap: lap['LapNumber'],
                        })
                    }
                }
            }

        } catch (err) {
            console.log(err)
        }
    }, [lastJsonMessage])

    return {
        startMessaging,
        result: driver
    }
}

export default useAlphaTimerWebsocket