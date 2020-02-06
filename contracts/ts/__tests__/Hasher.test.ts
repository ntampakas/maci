require('module-alias/register')
import { genAccounts, genTestAccounts } from '../accounts'
import { config } from 'maci-config'
import {
    hashLeftRight,
    hash,
    genRandomSalt,
    SnarkBigInt,
} from 'maci-crypto'

import * as etherlime from 'etherlime-lib'
const MiMC = require('@maci-contracts/compiled/MiMC.json')
const Hasher = require('@maci-contracts/compiled/Hasher.json')

const accounts = genTestAccounts(1)
let deployer
let hasherContract
let mimcContract

describe('Hasher', () => {
    beforeAll(async () => {
        deployer = new etherlime.JSONRPCPrivateKeyDeployer(
            accounts[0].privateKey,
            config.get('chain.url'),
            {
                gasLimit: 8800000,
            },
        )

        console.log('Deploying MiMC')
        mimcContract = await deployer.deploy(MiMC, {})

        console.log('Deploying Hasher')
        hasherContract = await deployer.deploy(Hasher, { CircomLib: mimcContract.contractAddress })
    })

    it('maci-crypto.hashLeftRight should match hasher.hashPair', async () => {
        const left = genRandomSalt()
        const right = genRandomSalt()
        const hashed = hashLeftRight(left, right)

        const onChainHash = await hasherContract.hashPair(left.toString(), right.toString())
        expect(onChainHash.toString()).toEqual(hashed.toString())
    })

    it('maci-crypto.hash should match hasher.hashMulti', async () => {
        let values: string[] = []
        for (let i=0; i < 10; i++) {
            values.push(genRandomSalt().toString())
        }
        const hashed = hash(values)

        const onChainHash = await hasherContract.hashMulti(values, 0)
        expect(onChainHash.toString()).toEqual(hashed.toString())
    })

    it('maci-crypto.hashOne should match hasher.hashMulti with one value', async () => {
        let values = [genRandomSalt().toString()]
        const hashed = hash(values)

        const onChainHash = await hasherContract.hashMulti(values, 0)
        expect(onChainHash.toString()).toEqual(hashed.toString())
    })
})
