import { Contract, TransactionBuilder, Networks, BASE_FEE, nativeToScVal, Address, rpc } from '@stellar/stellar-sdk'
import type { StellarWalletsKit} from 'stellar-wallets-kit'
import { WalletNetwork } from 'stellar-wallets-kit'

const rpcUrl = 'https://soroban-testnet.stellar.org'
const contractAddress = 'CCNEASTJ37SWUKVJVFNBKGYFUFVLKLI3XGRGB3NYVYT75UZPDBN5BFR3'

const params = {
  fee: BASE_FEE,
  networkPassphrase: Networks.TESTNET,
}

interface PlayerScore {
  player: string
  score: number
  timestamp: number
}

interface Tournament {
  id: number
  organizer: string
  name: string
  tour_type: string
  is_ind: boolean
  pub_tour: boolean
  fee: number
  deadline: number
  start: number
  end: number
  started: boolean
  completed: boolean
  players: string[]
  scores: PlayerScore[]
}

interface TournamentDetails {
  name: string
  tour_type: string
  is_ind: boolean
  pub_tour: boolean
  fee: number // i128 in Rust becomes bigint in TypeScript
  deadline: number // u64 timestamp
  start: number // u64 timestamp
  end: number // u64 timestamp
}

const stringToScVal = (value: string) => nativeToScVal(value, { type: 'string' })
const boolToScVal = (value: boolean) => nativeToScVal(value, { type: 'bool' })

const accountToScVal = (account: string) => new Address(account).toScVal()

async function callContractFunction(caller: string, kit: StellarWalletsKit, functionName: string, values?: any[]): Promise<any> {
  const provider = new rpc.Server(rpcUrl, { allowHttp: true })
  const contract = new Contract(contractAddress)
  const sourceAccount = await provider.getAccount(caller)

  const transactionBuilder = new TransactionBuilder(sourceAccount, params)

  if (values) {
    transactionBuilder.addOperation(contract.call(functionName, ...values))
  } else {
    transactionBuilder.addOperation(contract.call(functionName))
  }

  const builtTx = transactionBuilder.setTimeout(30).build()
  const preparedTx = await provider.prepareTransaction(builtTx)

  const signedTxXdr = await kit?.sign({ xdr: preparedTx.toXDR(), publicKey: caller as string, network: WalletNetwork.TESTNET })
  //const signedTx = await userSignTransaction(preparedTx.toXDR(), "TESTNET", caller);
  const tx = TransactionBuilder.fromXDR(signedTxXdr?.signedXDR as string, Networks.TESTNET)

  try {
    const sendTx = await provider.sendTransaction(tx).catch(function (err) {
      return err
    })
    if (sendTx.errorResult) {
      throw new Error('Unable to submit transaction')
    }
    if (sendTx.status === 'PENDING') {
      let txResponse = await provider.getTransaction(sendTx.hash)
      console.log(txResponse)
      while (txResponse.status === 'NOT_FOUND') {
        txResponse = await provider.getTransaction(sendTx.hash)
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
      if (txResponse.status === 'SUCCESS') {
        console.log(txResponse)
        const result = txResponse.returnValue
        return result
      }
    }
  } catch (err) {
    return err
  }
}

// Function to create tournament
export async function createTournament(details: TournamentDetails, kit: StellarWalletsKit, walletAddress: string) {
  try {
    const tourDetail = [
      accountToScVal(walletAddress),
      stringToScVal(details.name),
      stringToScVal(details.tour_type),
      boolToScVal(details.is_ind),
      boolToScVal(details.pub_tour),
      nativeToScVal(details.fee, { type: 'i128' }),
      nativeToScVal(Math.floor(details.deadline / 1000), { type: 'u64' }),
      nativeToScVal(Math.floor(details.start / 1000), { type: 'u64' }),
      nativeToScVal(Math.floor(details.end / 1000), { type: 'u64' }),
    ]
    console.log(tourDetail)
    const result = await callContractFunction(walletAddress, kit, 'create_tournament', tourDetail)
    return result?._value
  } catch (error) {
    console.error('Error creating tournament:', error)
    throw error
  }
}

// Function to register for a tournament
export async function registerForTournament(tournamentId: string, kit: StellarWalletsKit, caller: string) {
  try {
    const result = await callContractFunction(caller, kit, 'register_participant', [accountToScVal(caller), nativeToScVal(tournamentId, { type: 'u32' })])
    return result
  } catch (error) {
    console.error('Error registering for tournament:', error)
    throw error
  }
}

// Function to record match result (score)
export async function recordMatchResult(tournamentId: number, kit: StellarWalletsKit, score: number, caller: string) {
  try {
    const result = await callContractFunction(caller, kit, 'record_match_result', [
      accountToScVal(caller),
      nativeToScVal(tournamentId, { type: 'u32' }),
      nativeToScVal(score, { type: 'u32' }),
    ])
    return result
  } catch (error) {
    console.error('Error recording match result:', error)
    throw error
  }
}

// Function to distribute rewards
export async function distributeRewards(tournamentId: number, kit: StellarWalletsKit, caller: string) {
  try {
    const result = await callContractFunction(caller, kit, 'distribute_rewards', [accountToScVal(caller), nativeToScVal(tournamentId, { type: 'u32' })])
    return result
  } catch (error) {
    console.error('Error distributing rewards:', error)
    throw error
  }
}

// Function to get tournament by ID
export async function getTournament(tournamentId: number, kit: StellarWalletsKit, caller: string): Promise<Tournament> {
  try {
    const result = await callContractFunction(caller, kit, 'get_tournament_by_id', [nativeToScVal(tournamentId, { type: 'u32' })])
    return result
  } catch (error) {
    console.error('Error getting tournament:', error)
    throw error
  }
}

// Function to get player score
export async function getPlayerScore(tournamentId: number, kit: StellarWalletsKit, playerAddress: string, caller: string): Promise<number | null> {
  try {
    const result = await callContractFunction(caller, kit, 'get_player_score', [nativeToScVal(tournamentId, { type: 'u32' }), accountToScVal(playerAddress)])
    return result?._value
  } catch (error) {
    console.error('Error getting player score:', error)
    throw error
  }
}

// Function to get leaderboard
export async function getLeaderboard(tournamentId: number, kit: StellarWalletsKit, caller: string): Promise<PlayerScore[]> {
  try {
    const result = await callContractFunction(caller, kit, 'get_leaderboard', [nativeToScVal(tournamentId, { type: 'u32' })])
    return result
  } catch (error) {
    console.error('Error getting leaderboard:', error)
    throw error
  }
}
