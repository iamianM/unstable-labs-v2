import Card from '@components/Card'
import type { Experiment, NftURI } from "../types/types"
import { useExperiments } from '@hooks/useExperiments'

function Experiments() {

    const { experiments } = useExperiments()

    return (
        <>
            {experiments?.map((experiment: Experiment, index: number) => (
                <Card key={index} nft={experiment} />
            ))}
        </>
    )
}

export default Experiments