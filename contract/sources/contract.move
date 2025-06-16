module staking::flexibleStaking {
    use std::signer;
    use std::error;
    use std::timestamp;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::account;
    use aptos_std::table::{Self, Table};

    // Error codes
    const E_INSUFFICIENT_BALANCE: u64 = 1;
    const E_ALREADY_STAKING: u64 = 2;
    const E_NOT_STAKING: u64 = 3;
    const E_NOT_INITIALIZED: u64 = 4;

    // Constants
    const STAKE_AMOUNT: u64 = 100000000; // 1 APT in octas (1 APT = 10^8 octas)

    // Staking information for each user
    struct StakeInfo has store, drop {
        amount: u64,
        stake_time: u64,
        is_active: bool,
    }

    // Global staking pool resource
    struct StakingPool has key {
        total_staked: u64,
        stakers: Table<address, StakeInfo>,
        pool_coins: coin::Coin<AptosCoin>,
    }

    // Initialize the staking pool - call this once to set up the contract
    public entry fun initialize(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        
        // Ensure the staking pool doesn't already exist
        assert!(!exists<StakingPool>(admin_addr), E_ALREADY_STAKING);
        
        // Create the staking pool
        let staking_pool = StakingPool {
            total_staked: 0,
            stakers: table::new(),
            pool_coins: coin::zero<AptosCoin>(),
        };
        
        move_to(admin, staking_pool);
    }

    // Stake exactly 1 APT
    public entry fun stake(staker: &signer, pool_owner: address) acquires StakingPool {
        let staker_addr = signer::address_of(staker);
        
        // Check if staking pool exists
        assert!(exists<StakingPool>(pool_owner), E_NOT_INITIALIZED);
        
        // Check if user has sufficient balance
        let balance = coin::balance<AptosCoin>(staker_addr);
        assert!(balance >= STAKE_AMOUNT, E_INSUFFICIENT_BALANCE);
        
        let staking_pool = borrow_global_mut<StakingPool>(pool_owner);
        
        // Check if user is already staking
        if (table::contains(&staking_pool.stakers, staker_addr)) {
            let existing_stake = table::borrow(&staking_pool.stakers, staker_addr);
            assert!(!existing_stake.is_active, E_ALREADY_STAKING);
        };
        
        // Withdraw exactly 1 APT from staker's account
        let stake_coins = coin::withdraw<AptosCoin>(staker, STAKE_AMOUNT);
        
        // Add to pool
        coin::merge(&mut staking_pool.pool_coins, stake_coins);
        
        // Record stake information
        let stake_info = StakeInfo {
            amount: STAKE_AMOUNT,
            stake_time: timestamp::now_seconds(),
            is_active: true,
        };
        
        // Update or insert staker info
        if (table::contains(&staking_pool.stakers, staker_addr)) {
            let existing_stake = table::borrow_mut(&mut staking_pool.stakers, staker_addr);
            *existing_stake = stake_info;
        } else {
            table::add(&mut staking_pool.stakers, staker_addr, stake_info);
        };
        
        // Update total staked
        staking_pool.total_staked = staking_pool.total_staked + STAKE_AMOUNT;
    }

    // Unstake and withdraw the staked APT
    public entry fun unstake(staker: &signer, pool_owner: address) acquires StakingPool {
        let staker_addr = signer::address_of(staker);
        
        // Check if staking pool exists
        assert!(exists<StakingPool>(pool_owner), E_NOT_INITIALIZED);
        
        let staking_pool = borrow_global_mut<StakingPool>(pool_owner);
        
        // Check if user has an active stake
        assert!(table::contains(&staking_pool.stakers, staker_addr), E_NOT_STAKING);
        
        let stake_info = table::borrow_mut(&mut staking_pool.stakers, staker_addr);
        assert!(stake_info.is_active, E_NOT_STAKING);
        
        // Extract coins from pool
        let withdraw_coins = coin::extract(&mut staking_pool.pool_coins, stake_info.amount);
        
        // Deposit back to staker
        coin::deposit(staker_addr, withdraw_coins);
        
        // Update stake info
        stake_info.is_active = false;
        
        // Update total staked
        staking_pool.total_staked = staking_pool.total_staked - stake_info.amount;
    }

    // View functions
    
    // Check if user is currently staking
    #[view]
    public fun is_staking(staker_addr: address, pool_owner: address): bool acquires StakingPool {
        if (!exists<StakingPool>(pool_owner)) {
            return false
        };
        
        let staking_pool = borrow_global<StakingPool>(pool_owner);
        
        if (!table::contains(&staking_pool.stakers, staker_addr)) {
            return false
        };
        
        let stake_info = table::borrow(&staking_pool.stakers, staker_addr);
        stake_info.is_active
    }
    
    // Get user's stake information
    #[view]
    public fun get_stake_info(staker_addr: address, pool_owner: address): (u64, u64, bool) acquires StakingPool {
        assert!(exists<StakingPool>(pool_owner), E_NOT_INITIALIZED);
        
        let staking_pool = borrow_global<StakingPool>(pool_owner);
        
        if (!table::contains(&staking_pool.stakers, staker_addr)) {
            return (0, 0, false)
        };
        
        let stake_info = table::borrow(&staking_pool.stakers, staker_addr);
        (stake_info.amount, stake_info.stake_time, stake_info.is_active)
    }
    
    // Get total amount staked in the pool
    #[view]
    public fun get_total_staked(pool_owner: address): u64 acquires StakingPool {
        assert!(exists<StakingPool>(pool_owner), E_NOT_INITIALIZED);
        
        let staking_pool = borrow_global<StakingPool>(pool_owner);
        staking_pool.total_staked
    }
    
    // Check user's wallet balance (helper function)
    #[view]
    public fun get_user_balance(user_addr: address): u64 {
        coin::balance<AptosCoin>(user_addr)
    }
}