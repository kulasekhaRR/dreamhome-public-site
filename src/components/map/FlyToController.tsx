import { useEffect } from 'react'
import { useMap } from 'react-leaflet'

const FlyToController = ({ target }: { target: [number, number] | null }) => {
    const map = useMap()

    useEffect(() => {
        if (target) map.flyTo(target, 14, { duration: 0.8 })
    }, [target, map])

    return null
}

export default FlyToController
