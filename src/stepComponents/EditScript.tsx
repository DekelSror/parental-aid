import React, { useContext, useState } from 'react'
import { TextField, Stack , Button, Typography} from '@mui/material'
import { WizardContext } from '../store'
import useBackend from '../Backend'
import { userContext } from '../App'

const EditScript = ({onChange}: {onChange: (script: string) => void}) => {
    const {prompt, script} = useContext(WizardContext)
    const backend = useBackend()
    const user = useContext(userContext)
    const [edited, setEdited] = useState(script)

    const handleChange = (text: string) => {
        setEdited(text)
        onChange(text)
    }

    return <Stack>
        <Stack flex={2} direction='row' gap={2} >
            <Stack sx={{flex: 1}} gap={1}>
                <Typography variant='h4' > Prompt </Typography>
                <TextField multiline value={prompt} />
            </Stack>
            <Stack sx={{flex: 1}} gap={1}>
                <Typography variant='h4' > Script </Typography>
                <TextField multiline value={edited} contentEditable onChange={e => handleChange(e.target.value)} />
            </Stack>
        </Stack>
        {user.role === 'editor' && <Button onClick={() => backend.savePrompt(prompt, user.email)} > save prompt </Button>}
    </Stack>
}

export default EditScript