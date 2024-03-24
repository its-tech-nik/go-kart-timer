import { useEffect, useRef, useState } from 'react'
import useWebSocket from 'react-use-websocket';

const useAlphaTimerWebsocket = (track: string, driverName: string) => {
    // const { sendJsonMessage, lastJsonMessage } = useWebSocket('ws://localhost:443')
    const { sendJsonMessage, lastJsonMessage, getWebSocket } = useWebSocket('wss://ws-eu.pusher.com/app/3aaffebc8193ea83cb2f?protocol=7&client=js&version=3.1.0&flash=false')

    const [sessionId, setSessionId] = useState<number>()
    const [driverDetails, setDriverDetails] = useState({
        id: null,
        name: null,
    })

    const [position, setPosition] = useState<number>(0)
    const [lastLapTime, setLastLapTime] = useState<number>(0)
    const [gap, setGap] = useState<number>(0)
    const [gapBehind, setGapBehind] = useState<number>(0)
    const [currentLapNumber, setCurrentLapNumber] = useState<number>(0)
    const [bestOverallLaptime, setBestOverallLaptime] = useState<number>(Infinity)
    const [previousBestLaps, setPreviousBestLaps] = useState([
        {
            time: Infinity,
            lap: 0,
        },
        {
            time: Infinity,
            lap: 0,
        },
        {
            time: Infinity,
            lap: 0,
        },
    ])
    const [raceEvent, setRaceEvent] = useState<string>('')

    const lastRecordedSequenceNumber = useRef<number>(-1)
    const lastRecordedLapNumber = useRef<number>(-1)

    const startCommunication = (competitor: any) => {
        console.log('startCommunication', competitor)
        if (competitor) {
            setDriverDetails({
                id: competitor['CompetitorId'],
                name: competitor['CompetitorName'],
            })
        }

        sendJsonMessage({
            event: "pusher:subscribe",
            data: { channel: `${track}prod` }
        })
    }

    const testForNoMissingPackets = (sequence: number) => {
        if (sequence === 1) lastRecordedSequenceNumber.current = 1

        if (lastRecordedSequenceNumber.current < 0)
            lastRecordedSequenceNumber.current = sequence

        return sequence !== lastRecordedSequenceNumber.current++
    }

    const reInitWebsocketConnection = () => {
        console.log(driverDetails)
    }

    const testForNoMissingLaps = (lap: number) => {
        if (lap === 1) lastRecordedLapNumber.current = 1

        if (lastRecordedLapNumber.current < 0)
            lastRecordedLapNumber.current = lap

        return lap !== lastRecordedLapNumber.current++
    }

    useEffect(() => {
        if (driverName && track) {
            // startCommunication()
        }
    }, [])

    useEffect(() => {
        const sd = null

        if (!driverName) return

        if (lastJsonMessage) {
            const { data, event } = lastJsonMessage as any

            if ((event === 'update' || event === 'new_session' || event === 'updated_session') && data) {
                const dataJson = JSON.parse(data)

                // On each new session zero all values
                if (event === 'new_session') {
                    setPosition(0)
                    setLastLapTime(0)
                    setGap(0)
                    setCurrentLapNumber(0)
                    setBestOverallLaptime(Infinity)
                    setPreviousBestLaps([
                        {
                            time: Infinity,
                            lap: 0,
                        },
                        {
                            time: Infinity,
                            lap: 0,
                        },
                        {
                            time: Infinity,
                            lap: 0,
                        },
                    ])
                }
                else if (event === 'updated_session') console.log('UPDATED SESSION')

                // grab the new sessionId if we are in a new session
                if (dataJson['SessionId'] && dataJson['SessionId'] !== sessionId) setSessionId(dataJson['SessionId'])
        
                // if (dataJson['Sequence'] && testForNoMissingPackets(dataJson['Sequence'])) throw new Error(`Missing Packet: ${dataJson['Sequence']}`)
            
                if (dataJson['Competitors']) {
                    const competitors = dataJson['Competitors']

                    for (let i=0; i < competitors.length; i++) {
                        // show data for the session selected (10m or 20m) or show all if class is not selected
                        if (dataJson['SD'] !== sd && sd) continue

                        const competitor = competitors[i]

                        // Grab the competitorId associated with the CompetitorName
                        if (competitor['CompetitorName'] && competitor['CompetitorName'] === driverName) {
                            setDriverDetails({...driverDetails, id: competitor['CompetitorId']})
                        }

                        if (competitor['BestLaptime'] && competitor['BestLaptime'] < bestOverallLaptime) setBestOverallLaptime(competitor['BestLaptime'])

                        if (competitor['CompetitorId'] !== driverDetails.id && competitor['Laps']) {
                            if ((competitor['Laps'][0]['Position'] === (position + 1)) && competitor['Laps'][0]['Gap']) {
                                setGapBehind(competitor['Laps'][0]['Gap'])
                            }
                        }

                        if (!driverDetails.id) return

                        // show data only for selected competitor using its ID
                        if (competitor['CompetitorId'] === driverDetails.id) {
                            if (competitor['TakenChequered']) {
                                setRaceEvent('finished_race')
                            } else if(raceEvent !== 'update') {
                                setRaceEvent('update')
                            }
                            
                            if (competitor['NumberOfLaps'] && testForNoMissingLaps(competitor['NumberOfLaps'])) throw new Error(`Missing Lap: ${competitor['NumberOfLaps']}`)

                            if (competitor['Laps']) {
                                const lap = competitor['Laps'][0]

                                if (lap['Position']) setPosition(lap['Position'])

                                if (lap['LapTime']) {
                                    setLastLapTime(lap['LapTime'])

                                    if (lap['LapTime'] && lap['LapTime'] < previousBestLaps[2].time) {
                                        addPreviousBestLap({
                                            time: lap['LapTime'],
                                            lap: competitor['NumberOfLaps'],
                                        })
                                    }
                                }

                                if(lap['Gap']) setGap(lap['Gap'])

                                if(lap['LapNumber']) setCurrentLapNumber(lap['LapNumber'])
                            }
                        }
                    }
                }
            }
        }
    }, [lastJsonMessage])

    const calculateBestOverallLaptime = (competitors: any) => {
        setBestOverallLaptime(competitors.reduce((acc: number, value: any) => {
            if (acc < value['BestLaptime']) return acc
            return value['BestLaptime']
        }, Infinity))
    }

    const addPreviousBestLap = (previousLap: any) => {
        setPreviousBestLaps([
            previousBestLaps[0],
            previousBestLaps[1],
            previousLap,
        ].sort((a, b) => a.time - b.time))
    }

    return {
        startCommunication,
        calculateBestOverallLaptime,
        addPreviousBestLap,
        reInitWebsocketConnection,
        result: {
            ...driverDetails,
            position,
            lastLapTime,
            gap,
            gapBehind,
            currentLapNumber,
            bestOverallLaptime,
            previousBestLaps,
            raceEvent,
        },
        setters: {
            setGap,
            setCurrentLapNumber,
            setPosition,
        }
    }
}

export default useAlphaTimerWebsocket