import { useContext, useEffect, useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { Dialog, Stack, TextField } from '@fluentui/react'
import { CopyRegular } from '@fluentui/react-icons'

import { CosmosDBStatus } from '../../api'
import Contoso from '../../assets/Contoso.svg'
import { HistoryButton, ShareButton, SignOutButton } from '../../components/common/Button'
import { AppStateContext } from '../../state/AppProvider'

import styles from './Layout.module.css'

const Layout = () => {
  const [isSharePanelOpen, setIsSharePanelOpen] = useState<boolean>(false)
  const [copyClicked, setCopyClicked] = useState<boolean>(false)
  const [copyText, setCopyText] = useState<string>('Copy URL')
  const [shareLabel, setShareLabel] = useState<string | undefined>('Share')
  const [hideHistoryLabel, setHideHistoryLabel] = useState<string | undefined>('Hide')
  const [showHistoryLabel, setShowHistoryLabel] = useState<string | undefined>('Show')
  const [logo, setLogo] = useState('')
  const [isSignOutContainerOpen, setIsSignOutContainerOpen] = useState<boolean>(false)
  
  const appStateContext = useContext(AppStateContext)
  const ui = appStateContext?.state.frontendSettings?.ui

  const handleShareClick = () => {
    setIsSharePanelOpen(true)
  }

  const handleSharePanelDismiss = () => {
    setIsSharePanelOpen(false)
    setCopyClicked(false)
    setCopyText('Copy URL')
  }

  const handleCopyClick = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopyClicked(true)
  }

  const handleHistoryClick = () => {
    appStateContext?.dispatch({ type: 'TOGGLE_CHAT_HISTORY' })
  }

  // Toggle sign-out container when logo is clicked
  const handleLogoClick = () => {
    setIsSignOutContainerOpen(prev => !prev)
  }

  const handleSignOut = () => {
    // Implement your sign out logic here
    window.location.href = '/.auth/logout?post_logout_redirect_uri=https://www.catmedia.ie/experts'
    // Optionally close the container after signing out
    setIsSignOutContainerOpen(false)
  }

  useEffect(() => {
    if (!appStateContext?.state.isLoading) {
      setLogo(ui?.logo || Contoso)
    }
  }, [appStateContext?.state.isLoading])

  useEffect(() => {
    if (copyClicked) {
      setCopyText('Copied URL')
    }
  }, [copyClicked])

  useEffect(() => { }, [appStateContext?.state.isCosmosDBAvailable.status])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 480) {
        setShareLabel(undefined)
        setHideHistoryLabel(undefined)
        setShowHistoryLabel(undefined)
      } else {
        setShareLabel('Share')
        setHideHistoryLabel(undefined)
        setShowHistoryLabel(undefined)
      }
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className={styles.layout}>
      <header className={styles.header} role={'banner'}>
        <Stack horizontal verticalAlign="center" horizontalAlign="space-between">
          <Stack horizontal verticalAlign="center">
            {/* Wrap the logo in a relative container */}
            <div style={{ position: 'relative' }}>
              <img 
                src={logo} 
                className={styles.headerIcon} 
                aria-hidden="true" 
                alt="" 
                onClick={handleLogoClick} 
                style={{ cursor: 'pointer' }} 
              />
              {isSignOutContainerOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    background: '#fff',
                    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
                    width: 'auto',
                    borderRadius: '4px',
                    padding: '8px',
                    zIndex: 10
                  }}
                >
                  <SignOutButton text="Sign out" onClick={handleSignOut} />
                </div>
              )}
            </div>
            <Link to="/" className={styles.headerTitleContainer}>
              <h1 className={styles.headerTitle}>{ui?.title}</h1>
            </Link>
          </Stack>
          <Stack horizontal tokens={{ childrenGap: 4 }} className={styles.shareButtonContainer}>
            {appStateContext?.state.isCosmosDBAvailable?.status !== CosmosDBStatus.NotConfigured &&
              ui?.show_chat_history_button !== false && (
                <HistoryButton
                  onClick={handleHistoryClick}
                  text={
                    appStateContext?.state?.isChatHistoryOpen ? hideHistoryLabel : showHistoryLabel
                  }
                />
              )}
            {ui?.show_share_button && <ShareButton onClick={handleShareClick} text={shareLabel} />}
          </Stack>
        </Stack>
      </header>
      <Outlet />
      <Dialog
        onDismiss={handleSharePanelDismiss}
        hidden={!isSharePanelOpen}
        styles={{
          main: [
            {
              selectors: {
                ['@media (min-width: 480px)']: {
                  maxWidth: '600px',
                  background: '#FFFFFF',
                  boxShadow: '0px 14px 28.8px rgba(0, 0, 0, 0.24), 0px 0px 8px rgba(0, 0, 0, 0.2)',
                  borderRadius: '8px',
                  maxHeight: '200px',
                  minHeight: '100px'
                }
              }
            }
          ]
        }}
        dialogContentProps={{
          title: 'Share this expert',
          showCloseButton: true
        }}
      >
        <Stack horizontal verticalAlign="center" style={{ gap: '8px' }}>
          <TextField className={styles.urlTextBox} defaultValue={window.location.href} readOnly />
          <div
            className={styles.copyButtonContainer}
            role="button"
            tabIndex={0}
            aria-label="Copy"
            onClick={handleCopyClick}
            onKeyDown={e => (e.key === 'Enter' || e.key === ' ' ? handleCopyClick() : null)}
          >
            <CopyRegular className={styles.copyButton} />
            <span className={styles.copyButtonText}>{copyText}</span>
          </div>
        </Stack>
      </Dialog>
    </div>
  )
}

export default Layout
