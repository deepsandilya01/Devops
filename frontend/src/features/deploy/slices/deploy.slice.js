import { createSlice } from "@reduxjs/toolkit";

const deploySlice = createSlice({
    name:"deploy",
    initialState:{
        error:null,
        loading:false
    },
    reducers: {
        setLoading:(state, action) => {
            state.loading = action.payload;
        },
        setError:(state, action) => {
            state.error = action.payload;
        },
    }
})

export const {setLoading,setError} = deploySlice.actions
export default deploySlice.reducer