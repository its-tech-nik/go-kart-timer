const calculateBestOverallLaptime = (competitors: any[]) => {
    return competitors.reduce((acc: number, value: any) => {
        if (acc < value['BestLaptime']) return acc
        return value['BestLaptime']
    }, Infinity)
}

export { calculateBestOverallLaptime }