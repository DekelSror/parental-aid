import React, { useContext, useState } from 'react'
import { WizardContext, answers } from '../store'
import { Button, ButtonGroup, Stack, Typography } from '@mui/material'
import { colors } from '../styles'
import { globz } from '../globalize'
import OptionsAndInput from '../OptionsAndInput'


const Challenge = ({onChange}: {onChange: (challenge: string) => void}) => {
    const ctx = useContext(WizardContext)

    const [challenge, setChallenge] = useState(ctx.challenge)

    const handleChange = (clg: string) => {
        setChallenge(clg)
        onChange(clg)
    }
    
    return <Stack gap={4} justifyContent='center' p={2}>
        <Typography variant='subtitle2'> {globz('challenge.description')} </Typography>
        <OptionsAndInput
            options={answers.challenge}
            onChange={items => handleChange(items as string)}
            withInput
            addLabel='custom challenge'
        />
        
    </Stack>
}

export default Challenge