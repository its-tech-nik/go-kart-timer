import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"

const ItemSelectTrack = (props: any) => {
    const [activeSelection, setActiveSelection] = useState<boolean>(false)

    const clicked = useRef<boolean>()

    const selectItem = (value: any) => {
        props.onChange(value)
        setActiveSelection(false)
    }

    const trackCodeToName = (code: string) => {
        if (!code) return ''
        return props.tracks.find((track: any) => track.id === code)?.value
    }

    const selectHighlighted = (event: any) => {
        const selectionArea = document.getElementById("selection-area")?.getBoundingClientRect()
        const trackOptionsHTML = document.getElementById("track-options")

        if (!selectionArea) return

        if (!trackOptionsHTML) return

        if (event.clientX > selectionArea?.x && event.clientX < selectionArea.x + selectionArea.width && event.clientY > selectionArea.y && event.clientY < selectionArea.y + selectionArea.height) {
            const trackOptions = Array.from(trackOptionsHTML.children)

            for(let i=0; i < trackOptions.length; i++) {
                const box = trackOptions[i].getBoundingClientRect()
                if (box.y > selectionArea.y && box.y + box.height < selectionArea.y + selectionArea.height) {
                    selectItem(trackOptions[i].getAttribute('id'))
                }
            }
        } else {
            setActiveSelection(false)
        }
    }

    const scrollEndEvent = () => setTimeout(() => {
        if (!clicked.current) return

        const selectionArea = document.getElementById("selection-area")?.getBoundingClientRect()
        const trackOptionsHTML = document.getElementById("track-options")

        if (!selectionArea) return

        if (!trackOptionsHTML) return

        const trackOptions = Array.from(trackOptionsHTML.children)

        for(let i=0; i < trackOptions.length; i++) {
            const box = trackOptions[i].getBoundingClientRect()
            if (box.y > selectionArea.y && box.y + box.height < selectionArea.y + selectionArea.height) {
                selectItem(trackOptions[i].getAttribute('id'))
            }
        }
    }, 300)

    useEffect(() => {
        clicked.current = false
        const trackOptions = document.getElementById('track-options')

        if (!trackOptions) return

        trackOptions.addEventListener('scrollend', scrollEndEvent)

        if (activeSelection) document.getElementById(props.value)?.scrollIntoView({ behavior: "smooth", block: "center" })
        
        return () => {
            trackOptions.removeEventListener('scrollend', scrollEndEvent)
        }
    }, [activeSelection])

    const selectIndividualItem = async (evt: any) => {
        evt.stopPropagation()
        evt.target.scrollIntoView({ behavior: "smooth", block: "center" })
        clicked.current = true
    }

    return (
        <div>
            <div className="cursor-pointer" onClick={() => setActiveSelection(true)}>
                <span>Track: </span>
                <span>{trackCodeToName(props.value)}</span>
            </div>
            {
                activeSelection &&
                <div className="absolute w-full h-full top-0 left-0 bg-[rgba(28,28,30,.5)] backdrop-blur">

                    <div id="selection-area" className="fixed top-1/2 -translate-y-1/2 w-full h-16 bg-[rgba(255,255,255,.5)] z-10 pointer-events-none">
                    </div>
                    
                    <div onClick={selectHighlighted} id="track-options" className="h-full py-44 overflow-y-scroll snap-y snap-proximity snap-mandatory flex flex-col items-center gap-10 z-10">
                        {props.tracks.map((value: any) => {
                            return (
                                <div id={value.id} key={value.id} className="snap-center text-2xl" onClick={selectIndividualItem}>{value.value}</div>
                            )
                        })}
                    </div>
                </div>
            }
        </div>
    )
}

const ItemSelectDriver = (props: any) => {
    const [activeSelection, setActiveSelection] = useState<boolean>(false)

    const clicked = useRef<boolean>()

    const selectItem = (value: any) => {
        props.onChange(value)
        setActiveSelection(false)
    }

    const selectHighlighted = (event: any) => {
        const selectionArea = document.getElementById("selection-area")?.getBoundingClientRect()
        const trackOptionsHTML = document.getElementById("driver-options")

        if (!selectionArea) return

        if (!trackOptionsHTML) return

        if (event.clientX > selectionArea?.x && event.clientX < selectionArea.x + selectionArea.width && event.clientY > selectionArea.y && event.clientY < selectionArea.y + selectionArea.height) {
            const trackOptions = Array.from(trackOptionsHTML.children)

            for(let i=0; i < trackOptions.length; i++) {
                const box = trackOptions[i].getBoundingClientRect()
                if (box.y > selectionArea.y && box.y + box.height < selectionArea.y + selectionArea.height) {
                    selectItem(trackOptions[i].getAttribute('id'))
                }
            }
        } else {
            setActiveSelection(false)
        }
    }

    const scrollEndEvent = () => setTimeout(() => {
        if (!clicked.current) return

        const selectionArea = document.getElementById("selection-area")?.getBoundingClientRect()
        const trackOptionsHTML = document.getElementById("driver-options")

        if (!selectionArea) return

        if (!trackOptionsHTML) return

        const trackOptions = Array.from(trackOptionsHTML.children)

        for(let i=0; i < trackOptions.length; i++) {
            const box = trackOptions[i].getBoundingClientRect()
            if (box.y > selectionArea.y && box.y + box.height < selectionArea.y + selectionArea.height) {
                console.log(trackOptions[i].getAttribute('id'))
                selectItem(trackOptions[i].getAttribute('id'))
            }
        }
    }, 300)

    useEffect(() => {
        clicked.current = false
        const trackOptions = document.getElementById('driver-options')

        if (!trackOptions) return

        trackOptions.addEventListener('scrollend', scrollEndEvent)

        console.log('here', props.value)

        if (activeSelection) document.getElementById(props.value)?.scrollIntoView({ behavior: "smooth", block: "center" })
        
        return () => {
            trackOptions.removeEventListener('scrollend', scrollEndEvent)
        }
    }, [activeSelection])

    const selectIndividualItem = async (evt: any) => {
        evt.stopPropagation()
        evt.target.scrollIntoView({ behavior: "smooth", block: "center" })
        clicked.current = true
    }

    return (
        <div>
            <div className="cursor-pointer" onClick={() => setActiveSelection(true)}>
                <span>Driver: </span>
                <span>{props.value}</span>
            </div>
            {
                activeSelection &&
                <div className="absolute w-full h-full top-0 left-0 bg-[rgba(28,28,30,.5)] backdrop-blur">

                    <div id="selection-area" className="fixed top-1/2 -translate-y-1/2 w-full h-16 bg-[rgba(255,255,255,.5)] z-10 pointer-events-none">
                    </div>
                    
                    <div onClick={selectHighlighted} id="driver-options" className="h-full py-44 overflow-y-scroll snap-y snap-proximity snap-mandatory flex flex-col items-center gap-10 z-10">
                        {props.values.map((value: any) => {
                            return (
                                <div id={value['CompetitorName']} key={value['CompetitorId']} className="snap-center text-2xl" onClick={selectIndividualItem}>{value['CompetitorName']}</div>
                            )
                        })}
                    </div>
                </div>
            }
        </div>
    )
}

export { ItemSelectTrack, ItemSelectDriver }