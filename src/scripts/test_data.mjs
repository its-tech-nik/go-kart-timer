import data from './sunday_12_nov.json' assert { type: "json"}

const networkWebsocket = data.log.entries.find(entry => {
    return Object.keys(entry).includes('_webSocketMessages')
})

const { _webSocketMessages } = networkWebsocket

const clearedMessages = _webSocketMessages.filter(msg => msg.type !== "send").map(msg => JSON.parse(msg.data))

let lastRecordedSequenceNumber = 0
let lastRecordedLapNumber = 1

const testForNoMissingPackets = (sequence) => {
    if (sequence === 1) {
        lastRecordedSequenceNumber = 1
    }

    return sequence !== lastRecordedSequenceNumber++
}

const testForNoMissingLaps = (lap) => {
    if (lap === 1) {
        lastRecordedLapNumber = 1
    }

    return lap !== lastRecordedLapNumber++
}

const uniqueIds = []

const uniqueNames = []

const testDataFor = (competitorName, sd) => {

    let competitorId = null

    for (let j=0; j < clearedMessages.length; j++) {
        const { data, event } = clearedMessages[j]
    
        if ((event === 'update' || event === 'new_session' || event === 'updated_session') && data) {
            const dataJson = JSON.parse(data)
    
            if (event === 'new_session') console.log('NEW SESSION')
            else if (event === 'updated_session') console.log('UPDATED SESSION')
    
            if (dataJson['Sequence'] && testForNoMissingPackets(dataJson['Sequence'])) throw new Error('Missing Packet')
            
            if (dataJson['Competitors']) {
                const competitors = dataJson['Competitors']

                for (let i=0; i < competitors.length; i++) {
                    const competitor = competitors[i]

                    if (competitor['CompetitorName'] && !uniqueNames.includes(competitor['CompetitorName'])) uniqueNames.push(competitor['CompetitorName'])
                    if (!uniqueIds.includes(competitor['CompetitorId'])) uniqueIds.push(competitor['CompetitorId'])

                    // show data for the session selected (10m or 20m) or show all if class is not selected
                    if (dataJson['SD'] !== sd && sd) continue

                    // Grab the competitorId associated with the CompetitorName
                    if (competitor['CompetitorName'] && competitor['CompetitorName'] === competitorName) competitorId = competitor['CompetitorId']
                    // show data only for selected competitor using its ID
                    if (competitor['CompetitorId'] === competitorId) {
                        if (competitor['NumberOfLaps'] && testForNoMissingLaps(competitor['NumberOfLaps'])) throw new Error('Missing Lap')
    
                        if (competitor['NumberOfLaps']) {
                            console.log('NumberOfLaps', competitor['NumberOfLaps'], 'in', dataJson['SD'])
                            console.log('Laps', JSON.stringify(competitor['Laps']))
                        }
                    }
                }
            }
        }
    }
}

// [
//     'Christopher King',
//     'Sodi 16',
//     'Zeth Ockenden',
//     'Ash Curran',
//     'Neil Matthews',
//     'Daniel Bilek',
//     'Vivek Bhalla',
//     'Josh Clarke',
//     'Dan Giles',
//     'teddy mahoney',
//     'Max Francis',
//     'Annabelle Grant',
//     'Erlingas Cirtautas',
//     'Sodi 14'
// ]

testDataFor('Christopher King', '20m')
console.log(uniqueNames)
console.log(uniqueIds.sort((a,b) => a - b))

// console.log(clearedMessages)