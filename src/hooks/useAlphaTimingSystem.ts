import { useEffect, useState } from "react"
import useWebSocket, { ReadyState } from 'react-use-websocket';

import { calculateBestOverallLaptime } from "@/utils/calculateBestOverallTime"

const useAlphaTimingSystem = (track: string, driverName: string) => {
    // const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket('wss://ws-eu.pusher.com/app/3aaffebc8193ea83cb2f?protocol=7&client=js&version=3.1.0&flash=false')

    const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket('ws://localhost:443')

    const [driverIdentifier, setDriverIdentifier] = useState({
        id: null,
        name: null,
    })
    const [competitors, setCompetitors] = useState([])
    const [bestLapTime, setBestLapTime] = useState(Infinity)
    const [gapBehind, setGapBehind] = useState(0)

    // Selected Driver Data
    const [lapTime, setLapTime] = useState<number>(0)
    const [topThreeLaps, setTopThreeLaps] = useState([
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
    const [gap, setGap] = useState<number>(0)
    const [currentLapNumber, setCurrentLapNumber] = useState<number>(0)
    const [position, setPosition] = useState<number>(0)

    const [driverEvent, setDriverEvent] = useState<string>('')
    const [registered, setRegistered] = useState<boolean>(false)
    const [socketCompetitors, setSocketCompetitors] = useState<any[]>([])

    const resetDriverMeasurements = () => {
        setLapTime(0)
        setTopThreeLaps([
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
        setGap(0)
        setGapBehind(0)
        setCurrentLapNumber(0)
        setPosition(0)
        setRegistered(false)
    }

    const setSelectedDriverDataFromJson = (selectedDriver: any) => {
        setTopThreeLaps([
            topThreeLaps[0],
            topThreeLaps[1],
            {
                time: selectedDriver['BestLaptime'],
                lap: selectedDriver['BestLapNumber'],
            }
        ].sort((a, b) => a.time - b.time))
        setGapBehind(selectedDriver['Behind'])
        setGap(selectedDriver['Gap'])
        setPosition(selectedDriver['GridPosition'])
        setCurrentLapNumber(selectedDriver['NumberOfLaps'])

    }

    const setSelectedDriverData = (selectedDriver: any) => {

        if (selectedDriver['TakenChequered']) {
            setDriverEvent('finished_race')
        }
        
        if (selectedDriver['Laps']) {
            const lap = selectedDriver['Laps'][0]

            if (lap['Position']) setPosition(lap['Position'])

            if (lap['LapTime']) {
                setLapTime(lap['LapTime'])

                // add to top 3 best laps
                if (lap['LapTime'] && lap['LapTime'] < topThreeLaps[2].time) {
                    const previousBestLap = topThreeLaps[0].time
                    const sortedTopThreeLaps = [
                        topThreeLaps[0],
                        topThreeLaps[1],
                        {
                            time: lap['LapTime'],
                            lap: selectedDriver['NumberOfLaps'],
                        }
                    ].sort((a, b) => a.time - b.time)

                    setTopThreeLaps(sortedTopThreeLaps)

                    if (previousBestLap < Infinity && lap['LapTime'] === sortedTopThreeLaps[0].time) setDriverEvent('new_best_lap')
                }
            }

            if(lap['Gap']) setGap(lap['Gap'])

            if(lap['LapNumber']) setCurrentLapNumber(lap['LapNumber'])
        }

    }

    const getCompetitionData = async () => {
        if (!track) return

        const response = await fetch(`https://live.alphatiming.co.uk/${track}.json`)

        const raceSetup = await response.json()
        
        setCompetitors(raceSetup['Competitors'])

        console.log(raceSetup['Competitors'])

        setBestLapTime(raceSetup['blt']['tm'])

        return raceSetup['Competitors']
    }
    
    const getDriverData = async (subscribeToDataChannel: boolean = true) => {
        const competition = await getCompetitionData()

        const driver = competition?.find((competitor: any) => competitor['CompetitorName'] === driverName)

        if (driver) {
            setDriverIdentifier({
                id: driver['CompetitorId'],
                name: driver['CompetitorName'],
            })

            setSelectedDriverDataFromJson(driver)

            setRegistered(true)
        }

        if (subscribeToDataChannel) {
            sendJsonMessage({
                event: "pusher:subscribe",
                data: { channel: `${track}prod` }
            })
        }
    }

    // get data from json - 
    // try to find driver there (driver name and id) - 
    // if it is, register local driver, open connection and filter socket data for driver - 
    // if it is not, try to register the driver from socket data (using driver name)
        // for registration, keep track of all ids and make sure that all drivers have names
        // if they have, assign them as registered
            // if registered driver is local driver, stop the registration process
        // if they don't, increment the appearances
        // if at least one id is still unregistered after 3 iterations each
            // pull json and start the process from the beginning

    useEffect(() => {
        if (!driverName) {
            resetDriverMeasurements()
        }
        getDriverData(readyState !== ReadyState.OPEN)
    }, [driverName])
        
    const registerCompetitor = async (competitor: any) => {
        /**
         * Competitors are registered in the session with their CompetitorName and CompetitorId
         * only when they first pass from the start line. CompetitorName is received only on 
         * registration of the driver on the session, which we can use to associate it with the user's
         * driverName, that has been setup prior to the session, and will be used to get the
         * CompetitorId to filter the websocket messages specifically directed for our setup driver.
         */
        if (competitor['CompetitorName'] && competitor['CompetitorName'] === driverName) { // register selected driver
            setDriverIdentifier({
                id: competitor['CompetitorId'],
                name: competitor['CompetitorName']
            })

            setRegistered(true)

            return
        }

        // track all competitors to make sure everyone is registered in the session
        const index = socketCompetitors.findIndex(competitor => competitor.id === competitor['CompetitorId'])
        if (index > -1) {
            const socketCompetitor = socketCompetitors[index]

            if (socketCompetitor.registered) return

            // if at least one competitor has not been shown at least 3 times return false
            const stillUndiscoveredCompetitors = socketCompetitors.some((localCompetitor) => localCompetitor.appearances < 3)
        
            if (stillUndiscoveredCompetitors) {
                if (competitor['CompetitorName']) {
                    socketCompetitor.name = competitor['CompetitorName']
                    socketCompetitor.registered = true
                }

                socketCompetitor.appearances++
            } else {
                // get data from json
                await getDriverData(false)
            }
        } else {
            setSocketCompetitors([
                ...socketCompetitors,
                {
                    id: competitor['CompetitorId'] || '',
                    name: competitor['CompetitorName'] || '',
                    registered: competitor['CompetitorId'] && competitor['CompetitorName'], // TODO: make sure this returns true or flase depending on the combination of values
                    appearances: 1,
                }
            ])
        }
    }

    useEffect(() => {
        if (!driverName) return

        if (!lastJsonMessage) return

        const { data, event } = lastJsonMessage as any

        if (event === 'new_session') {
            setCompetitors([])
            resetDriverMeasurements()
        } else if ((event === 'update' || event === 'updated_session') && data) {

            setDriverEvent('update')

            const dataJson = JSON.parse(data)

            // if (dataJson['Sequence'] && testForNoMissingPackets(dataJson['Sequence'])) throw new Error(`Missing Packet: ${dataJson['Sequence']}`)
            // if (competitor['NumberOfLaps'] && testForNoMissingLaps(competitor['NumberOfLaps'])) throw new Error(`Missing Lap: ${competitor['NumberOfLaps']}`)
                    
            if (dataJson['Competitors']) {
                const competitors = dataJson['Competitors']

                for (let i=0; i < competitors.length; i++) {
                    const competitor = competitors[i]

                    if (competitor['BestLaptime'] && competitor['BestLaptime'] < bestLapTime) setBestLapTime(competitor['BestLaptime'])
                    
                    if (!registered) registerCompetitor(competitor)

                    if (competitor['CompetitorId'] !== driverIdentifier.id && competitor['Laps']) {
                        if ((competitor['Laps'][0]['Position'] === (position + 1)) && competitor['Laps'][0]['Gap']) {
                            setGapBehind(competitor['Laps'][0]['Gap'])
                        }
                    }

                    // Stop early if we don't have the correct CompetitorId
                    if (!driverIdentifier.id || competitor['CompetitorId'] !== driverIdentifier.id) return
                    
                    setSelectedDriverData(competitor)
                }
            }
        }
    }, [lastJsonMessage])

    return {
        race_competitors: competitors, // display on <select>
        driverEvent,
        display: {
            lapTime,
            topThreeLaps,
            gap,
            gapBehind,
            bestLapTime,
            currentLapNumber,
            position,
        },
    }
}

export default useAlphaTimingSystem