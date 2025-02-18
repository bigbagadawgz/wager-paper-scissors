
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as web3 from 'https://esm.sh/@solana/web3.js@1.87.6'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { action, roomCode, betAmount, publicKey } = await req.json()
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') as string
    const supabase = createClient(supabaseUrl, supabaseKey)

    const connection = new web3.Connection(web3.clusterApiUrl('devnet'), 'confirmed')

    switch (action) {
      case 'createEscrow': {
        // Generate a PDA for the escrow
        const escrowAccount = web3.Keypair.generate()
        const transaction = new web3.Transaction()

        // Add transfer instruction
        const transferInstruction = web3.SystemProgram.transfer({
          fromPubkey: new web3.PublicKey(publicKey),
          toPubkey: escrowAccount.publicKey,
          lamports: betAmount * web3.LAMPORTS_PER_SOL,
        })

        transaction.add(transferInstruction)

        // Update the game match with escrow info
        const { data: match, error: matchError } = await supabase
          .from('game_matches')
          .update({
            escrow_address: escrowAccount.publicKey.toString(),
            host_deposited: true,
          })
          .eq('room_code', roomCode)
          .select()
          .single()

        if (matchError) throw matchError

        return new Response(
          JSON.stringify({
            transaction: transaction.serialize({ verifySignatures: false }),
            escrowAddress: escrowAccount.publicKey.toString(),
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      case 'joinEscrow': {
        const { data: match, error: matchError } = await supabase
          .from('game_matches')
          .select('*')
          .eq('room_code', roomCode)
          .single()

        if (matchError) throw matchError

        const transaction = new web3.Transaction()
        const transferInstruction = web3.SystemProgram.transfer({
          fromPubkey: new web3.PublicKey(publicKey),
          toPubkey: new web3.PublicKey(match.escrow_address),
          lamports: betAmount * web3.LAMPORTS_PER_SOL,
        })

        transaction.add(transferInstruction)

        await supabase
          .from('game_matches')
          .update({
            opponent_deposited: true,
            opponent_pubkey: publicKey,
            status: 'active',
          })
          .eq('room_code', roomCode)

        return new Response(
          JSON.stringify({
            transaction: transaction.serialize({ verifySignatures: false }),
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      case 'claimWinnings': {
        const { data: match, error: matchError } = await supabase
          .from('game_matches')
          .select('*')
          .eq('room_code', roomCode)
          .single()

        if (matchError || !match.winner_pubkey) throw new Error('Match not found or winner not determined')

        const transaction = new web3.Transaction()
        const transferInstruction = web3.SystemProgram.transfer({
          fromPubkey: new web3.PublicKey(match.escrow_address),
          toPubkey: new web3.PublicKey(match.winner_pubkey),
          lamports: betAmount * 2 * web3.LAMPORTS_PER_SOL, // Transfer full pot
        })

        transaction.add(transferInstruction)

        await supabase
          .from('game_matches')
          .update({ status: 'completed' })
          .eq('room_code', roomCode)

        return new Response(
          JSON.stringify({
            transaction: transaction.serialize({ verifySignatures: false }),
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      default:
        throw new Error('Invalid action')
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
