import React, { createContext, useContext, useRef, useState } from 'react'
import { DDialog, NavButton, StepContainer, StreamScript, colors } from './styles'
import { Backdrop, Box, CircularProgress, Dialog, Stack, TextField, Typography, styled } from '@mui/material'
import Challenge from './stepComponents/Challenge'
import ConfigAvatar from './stepComponents/ConfigAvatar'
import ConfigOutput from './stepComponents/ConfigOutput'
import ContextQuestions from './stepComponents/ContextQuestions'
import EditScript from './stepComponents/EditScript'
import EducationalMethods from './stepComponents/EducationalMethods'
import Finalize from './stepComponents/Finalize'
import { WizardState, WizardContext, testState } from './store'
import useBackend from './Backend'
import App, { userContext } from './App'
import PromptBuilder from './PromptBuilder'

enum AppStep {context, output, review, finalize}

export const expandedContext = createContext<{expanded: string | undefined, setExpanded: (val: string | undefined) => void}>(
    {expanded: undefined, setExpanded: val => {}}
)

const DBackdrop = styled(Backdrop)(({theme}) => ({
    backdropFilter: 'blur(3px)',
}))

const Wizard = ({onSubmit, onExit}: {onSubmit: (stt: WizardState) => void, onExit: () => void}) => {
    const state = useRef<WizardState>(testState())
    const backend = useBackend()
    const [expanded, setExpanded] = useState<string>()
    const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.context)
    const user = useContext(userContext)
    
    const confirmationText = useRef<string>('')
    const [confirmationOpen, setConfirmationOpen] = useState<AppStep>()
    const [waitingForEngine, setWaitingForEngine] = useState(false)

    // to visualise streaming
    const [script, setScript] = useState(state.current.script)

    const [videoId, setVideoId] = useState<string>()

    const progressInterval = useRef<NodeJS.Timer>()

    const generateScript = () => {
        backend.streamScript(state.current, delta => {
                    
            const lastFinishReason = delta[delta.length - 1].choices[0].finish_reason
            const lastContent = delta[delta.length - 1].choices[0].delta.content
            if (lastFinishReason === 'stop' || (!lastContent)) {
                state.current.prompt = backend.scriptPrompt(state.current)  
                setCurrentStep(AppStep.output)
            }
            
            const parsed = delta.reduce((s, d) => {
                if (d.choices[0].delta.content) {
                    s += d.choices[0].delta.content
                }

                return s
            }, '')
            
            
            state.current.script = parsed
            setScript(parsed)
        })
    }

    const generateVideo = async() => {
        const videoId = await backend.generateVideo(state.current)
        setVideoId(videoId)

        progressInterval.current = setInterval(async() => {
            const statusOrUrl = await backend.videoProgress(videoId!)

            if (statusOrUrl.startsWith('http')) {
                state.current.outputUrl = statusOrUrl
                clearInterval(progressInterval.current)
                onSubmit(state.current)
            }
        }, 3000)
    }

    return <WizardContext.Provider value={state.current}>
        <expandedContext.Provider value={{expanded: expanded, setExpanded: setExpanded}}>
        <StepContainer gap={2}>
            <Typography variant='h3' > Context </Typography>
            <Challenge onChange={challenge => state.current = {...state.current, challenge: challenge}} />
            <ContextQuestions onSubmit={ctx => state.current = {...state.current, context: ctx}} />
            <EducationalMethods onSubmit={methods => state.current = {...state.current, educationalMethods: methods}} />
            <ConfigOutput onChange={config => state.current = {...state.current, outputConfig: config}} />
            {user.role === 'editor' && <PromptBuilder />}
            <NavButton disabled={currentStep !== AppStep.context} onClick={() => setCurrentStep(AppStep.review)} > Generate Script </NavButton>
        </StepContainer>
        </expandedContext.Provider>

        <DBackdrop open={currentStep === AppStep.review} onClick={() => setCurrentStep(AppStep.context)} sx={{zIndex: 3}} >
            <StepContainer p={2} gap={3} height={400} overflow='scroll'>

                <Typography variant='subtitle2'>please review your stuff</Typography>
                <Typography variant='subtitle1' style={{maxHeight: 270, whiteSpace: 'break-spaces', overflowY: 'scroll'}}> 
                    {JSON.stringify(state.current, null, 4)}  
                </Typography>
                <NavButton disabled={currentStep !== AppStep.review} onClick={() => {
                    generateScript()
                    setCurrentStep(AppStep.output)
                }} > 
                    Go! 
                </NavButton>
            </StepContainer>
        </DBackdrop>

        {currentStep === AppStep.output && <StepContainer >
            <EditScript onChange={script => state.current = {...state.current, script: script}} />
            <ConfigAvatar />
            <NavButton onClick={() => {
                generateVideo()
                setCurrentStep(AppStep.finalize)
            }} >
                Generate Video
            </NavButton>
        </StepContainer>}

        {currentStep === AppStep.finalize && <StepContainer>
            <Finalize />
        </StepContainer>}

        <Stack direction='row' gap={4} justifyContent='space-around' >
            <NavButton onClick={onExit} > exit </NavButton>
        </Stack>

    </WizardContext.Provider>
}

export default Wizard