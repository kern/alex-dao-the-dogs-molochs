import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

import { ethers, utils } from 'ethers';

export default new Vuex.Store({
    state: {
        provider: null,
        signer: null,
        chain: null,

        daoContract: null,
        daoStatics: null,

        approvedTokenContract: null,

        selectedDao: 'alex',

        daos: {
            alex: {
                name: '😎 AlexDAO 😎',
                key: 'alex',
                address: '0x96c8c63352d416378040a31ab8a231dd8104da58',
                unit: 'ALEX',
            },
        }
    },
    getters: {
        rootApi: (state) => {
            if (state.chainId === 5777) {
                return 'http://localhost:5000/block-cities/us-central1/api';
            }
            return 'https://us-central1-block-cities.cloudfunctions.net/api';
        },
        provider: (state) => state.provider,
        signer: (state) => state.signer,
        chain: (state) => state.chain,
        daoContract: (state) => state.daoContract,
        approvedTokenContract: (state) => state.approvedTokenContract,
        daoStatics: (state) => state.daoStatics,
        unit: (state) => state.daos[state.selectedDao].unit,
        doaName: (state) => state.daos[state.selectedDao].name,
        daos: (state) => state.daos,
        selectedDao: (state) => state.selectedDao,
    },
    mutations: {
        provider (state, provider) {
            state.provider = provider;
        },
        signer (state, signer) {
            state.signer = signer;
        },
        chain (state, chain) {
            state.chain = chain;
        },
        daoContract (state, daoContract) {
            state.daoContract = daoContract;
        },
        approvedTokenContract (state, approvedTokenContract) {
            state.approvedTokenContract = approvedTokenContract;
        },
        daoStatics (state, daoStatics) {
            state.daoStatics = daoStatics;
        },
        selectedDao (state, selectedDao) {
            state.selectedDao = selectedDao;
        }
    },
    actions: {
        async provider ({ commit, dispatch, state }, provider) {
            console.log('setting provider...');
            commit('provider', provider);
            commit('signer', provider.getSigner());

            const chain = await provider.getNetwork();
            commit('chain', chain);

            dispatch('daoContract', state.selectedDao);
        },
        async daoContract({ commit, dispatch, state }, daoName){
            console.log(`loading dao contract: ${daoName}`);

            commit('daoStatics', null);

            commit('selectedDao', daoName);

            const daoContract = new ethers.Contract(
                state.daos[state.selectedDao].address,
                require('./abi/molach-abi'),
                state.signer
            );
            commit('daoContract', daoContract);

            dispatch('contractStatics');
        },
        async contractStatics({ commit, dispatch, state }) {
            console.log('loading static stuff...');

            const processingReward = await state.daoContract.processingReward();
            const currentPeriod = await state.daoContract.getCurrentPeriod();
            const totalShares = await state.daoContract.totalShares();
            const proposalDeposit = await state.daoContract.proposalDeposit();
            const summoningTime = await state.daoContract.summoningTime();
            const dilutionBound = await state.daoContract.dilutionBound();
            const approvedToken = await state.daoContract.approvedToken();
            const periodDuration = await state.daoContract.periodDuration();
            const votingPeriodLength = await state.daoContract.votingPeriodLength();
            const gracePeriodLength = await state.daoContract.gracePeriodLength();

            const guildBank = await state.daoContract.guildBank();

            const approvedTokenContract = new ethers.Contract(
                approvedToken,
                require('./abi/erc20-abi'),
                state.signer
            );
            commit('approvedTokenContract', approvedTokenContract);

            const guildBankApprovedTokenBalance = await approvedTokenContract.balanceOf(guildBank);
            const daoBalance = await approvedTokenContract.balanceOf(state.daoContract.address);

            commit('daoStatics', {
                processingReward,
                currentPeriod,
                totalShares,
                proposalDeposit,
                summoningTime,
                guildBank,
                dilutionBound,
                approvedToken,
                periodDuration,
                votingPeriodLength,
                gracePeriodLength,
                guildBankApprovedTokenBalance,
                daoBalance,
            });
        }
    }
});
