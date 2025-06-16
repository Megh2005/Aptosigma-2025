#[test_only]
module staking::flexible_staking_test {
    use std::signer;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::{Self, AptosCoin};
    use aptos_framework::timestamp;
    use aptos_framework::account;
    use 0x1::flexible_staking;

    // Test constants
    const STAKE_AMOUNT: u64 = 100000000; // 1 APT in octas

    #[test(aptos_framework = @0x1, admin = @0x123, user = @0x456)]
    public fun test_complete_staking_flow(
        aptos_framework: &signer,
        admin: &signer,
        user: &signer,
    ) {
        // Initialize the blockchain environment
        timestamp::set_time_has_started_for_testing(aptos_framework);
        
        let admin_addr = signer::address_of(admin);
        let user_addr = signer::address_of(user);

        // Create accounts
        account::create_account_for_test(admin_addr);
        account::create_account_for_test(user_addr);

        // Initialize AptosCoin for testing
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);

        // Mint some APT to the user (5 APT to test flexibility)
        let user_coins = coin::mint<AptosCoin>(500000000, &mint_cap); // 5 APT
        coin::deposit(user_addr, user_coins);

        // Verify user has 5 APT
        let initial_balance = flexible_staking::get_user_balance(user_addr);
        assert!(initial_balance == 500000000, 1); // 5 APT

        // Initialize the staking pool
        flexible_staking::initialize(admin);

        // Verify pool is initialized with 0 total staked
        let total_staked = flexible_staking::get_total_staked(admin_addr);
        assert!(total_staked == 0, 2);

        // Verify user is not staking initially
        let is_staking = flexible_staking::is_staking(user_addr, admin_addr);
        assert!(!is_staking, 3);

        // User stakes 1 APT
        flexible_staking::stake(user, admin_addr);

        // Verify user balance decreased by exactly 1 APT
        let balance_after_stake = flexible_staking::get_user_balance(user_addr);
        assert!(balance_after_stake == 400000000, 4); // Should be 4 APT remaining

        // Verify user is now staking
        let is_staking_after = flexible_staking::is_staking(user_addr, admin_addr);
        assert!(is_staking_after, 5);

        // Verify stake info
        let (staked_amount, stake_time, is_active) = flexible_staking::get_stake_info(user_addr, admin_addr);
        assert!(staked_amount == STAKE_AMOUNT, 6); // 1 APT
        assert!(stake_time > 0, 7); // Should have a timestamp
        assert!(is_active, 8); // Should be active

        // Verify total staked in pool
        let total_staked_after = flexible_staking::get_total_staked(admin_addr);
        assert!(total_staked_after == STAKE_AMOUNT, 9); // 1 APT

        // User unstakes
        flexible_staking::unstake(user, admin_addr);

        // Verify user balance is restored
        let balance_after_unstake = flexible_staking::get_user_balance(user_addr);
        assert!(balance_after_unstake == 500000000, 10); // Back to 5 APT

        // Verify user is no longer staking
        let is_staking_final = flexible_staking::is_staking(user_addr, admin_addr);
        assert!(!is_staking_final, 11);

        // Verify stake info after unstaking
        let (_, _, is_active_final) = flexible_staking::get_stake_info(user_addr, admin_addr);
        assert!(!is_active_final, 12); // Should be inactive

        // Verify total staked is back to 0
        let total_staked_final = flexible_staking::get_total_staked(admin_addr);
        assert!(total_staked_final == 0, 13);

        // Clean up
        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    #[test(aptos_framework = @0x1, admin = @0x123, user = @0x456)]
    #[expected_failure(abort_code = 1)] // E_INSUFFICIENT_BALANCE
    public fun test_insufficient_balance_failure(
        aptos_framework: &signer,
        admin: &signer,
        user: &signer,
    ) {
        // Initialize the blockchain environment
        timestamp::set_time_has_started_for_testing(aptos_framework);
        
        let admin_addr = signer::address_of(admin);
        let user_addr = signer::address_of(user);

        // Create accounts
        account::create_account_for_test(admin_addr);
        account::create_account_for_test(user_addr);

        // Initialize AptosCoin for testing
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);

        // Mint insufficient APT to the user (0.5 APT)
        let user_coins = coin::mint<AptosCoin>(50000000, &mint_cap); // 0.5 APT
        coin::deposit(user_addr, user_coins);

        // Initialize the staking pool
        flexible_staking::initialize(admin);

        // This should fail due to insufficient balance
        flexible_staking::stake(user, admin_addr);

        // Clean up (this won't be reached due to failure)
        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    #[test(aptos_framework = @0x1, admin = @0x123, user = @0x456)]
    #[expected_failure(abort_code = 2)] // E_ALREADY_STAKING
    public fun test_double_staking_failure(
        aptos_framework: &signer,
        admin: &signer,
        user: &signer,
    ) {
        // Initialize the blockchain environment
        timestamp::set_time_has_started_for_testing(aptos_framework);
        
        let admin_addr = signer::address_of(admin);
        let user_addr = signer::address_of(user);

        // Create accounts
        account::create_account_for_test(admin_addr);
        account::create_account_for_test(user_addr);

        // Initialize AptosCoin for testing
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);

        // Mint sufficient APT to the user (3 APT)
        let user_coins = coin::mint<AptosCoin>(300000000, &mint_cap); // 3 APT
        coin::deposit(user_addr, user_coins);

        // Initialize the staking pool
        flexible_staking::initialize(admin);

        // First stake should succeed
        flexible_staking::stake(user, admin_addr);

        // Second stake should fail with E_ALREADY_STAKING
        flexible_staking::stake(user, admin_addr);

        // Clean up (this won't be reached due to failure)
        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }
}