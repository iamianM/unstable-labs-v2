import { useState } from 'react'
import vialContractInfo from "@abi/vial.json"
import TxHash from '@components/TxHash'
import { useContractWrite, useWaitForTransaction, usePrepareContractWrite, useContractRead, useFeeData, useBalance, useAccount } from 'wagmi'
import { CollectionMetadataURL, ConceptMetadataURL, RemixMetadataURL } from "@utils/metadata"
import { BigNumber } from 'ethers'
import { useVials } from '@hooks/useVials'
import SolidButton from '@components/SolidButton'
import Link from 'next/link'

type Props = {
    index: number;
    numberOfVials: number;
    type: "concept" | "collection" | "remix" | undefined;
}

function MintVialButton({ index, numberOfVials, type }: Props) {

    const [vialPrice, setVialPrice] = useState<BigNumber>()
    const [isMinting, setIsMinting] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [notEnoughBalance, setNotEnoughBalance] = useState(false)
    const { address } = useAccount()
    const { data: feeData } = useFeeData()
    const { data: balance } = useBalance({ address })
    const { refetchVials } = useVials()
    const txValue = vialPrice?.mul(BigNumber.from(numberOfVials))

    console.log(balance?.value, balance?.symbol)

    const tokenURI = type === "remix" ? RemixMetadataURL : type === "concept" ? `${ConceptMetadataURL}/${index}.json` : type === "collection" ? `${CollectionMetadataURL}/${index}.json` : ''

    useContractRead({
        address: vialContractInfo.address,
        abi: vialContractInfo.abi,
        functionName: "getVialPrice",
        onSuccess: (data) => {
            const vialPrice = BigNumber.from(data)
            setVialPrice(vialPrice)
        }
    })

    const { config } = usePrepareContractWrite({
        address: vialContractInfo.address,
        abi: vialContractInfo.abi,
        functionName: 'mintVials',
        args: [tokenURI, numberOfVials, { value: txValue, gasPrice: feeData?.gasPrice }],
    })

    const { write: mintVials, data: vialData } = useContractWrite({
        ...config,
        onError: (error) => {
            console.log(error)
            setIsMinting(false)
            setIsLoading(false)
        },
        onSuccess: () => {
            setIsMinting(true)
            refetchVials()
        }
    })

    useWaitForTransaction({
        hash: vialData?.hash,
        onError(error) {
            console.log(error)
            setIsMinting(false)
            setIsLoading(false)
        },
        onSuccess() {
            console.log("Transaction successful")
            setIsMinting(false)
            setIsLoading(false)
        }
    })



    return (
        <div className='py-4'>
            {
                notEnoughBalance &&
                <p className='text-[0.6rem] text-gray-700 text-center'>
                    You don&apos;t have enough balance to mint this vial, get ETH
                    <Link href="https://aurora.dev/faucet" target="_blank" className="underline text-acid"> here</Link>
                </p>
            }
            <div className='flex flex-col space-y-4 items-center justify-evenly pt-3'>
                <SolidButton type='button' onClick={() => {
                    if (balance?.value && txValue && balance?.value.lt(txValue)) {
                        setNotEnoughBalance(true)
                        return
                    }
                    setIsLoading(true)
                    mintVials?.()
                }} className=" bg-acid text-white" text='Mint' loading={isLoading} />
            </div>
            {isMinting &&
                <div className='mt-4'><TxHash className='text-black ' hash={`${vialData?.hash}`} /></div>}
        </div>
    )
}

export default MintVialButton