'use client'

import { useState } from 'react'
import { StackView } from '@/components/stack/StackView'
import { StackViewMinimal } from '@/components/stack/StackViewMinimal'
import { StackViewDebug } from '@/components/stack/StackViewDebug'
import { StackViewDebug2 } from '@/components/stack/StackViewDebug2'
import { StackViewProfile } from '@/components/stack/StackViewProfile'
import { StackViewNoConvex } from '@/components/stack/StackViewNoConvex'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Button } from '@/components/ui/button'

export default function StackLatencyTestPage() {
  const [testMode, setTestMode] = useState<'full' | 'minimal' | 'debug' | 'debug2' | 'profile' | 'noconvex'>('noconvex')
  
  // Get first workspace's stacks to test with
  const workspaces = useQuery(api.workspaces.listWorkspaces)
  const firstWorkspace = workspaces?.[0]
  const stacks = useQuery(
    api.stacks.listByWorkspace, 
    firstWorkspace ? { workspaceId: firstWorkspace._id } : 'skip'
  )
  const firstStack = stacks?.[0]
  
  return (
    <div className="container mx-auto p-8 max-w-6xl h-screen flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-4">Stack Component Latency Test</h1>
        <div className="flex gap-4 mb-4">
          <Button 
            onClick={() => setTestMode('full')} 
            variant={testMode === 'full' ? 'default' : 'outline'}
          >
            Full StackView
          </Button>
          <Button 
            onClick={() => setTestMode('debug')} 
            variant={testMode === 'debug' ? 'default' : 'outline'}
          >
            Debug StackView
          </Button>
          <Button 
            onClick={() => setTestMode('minimal')} 
            variant={testMode === 'minimal' ? 'default' : 'outline'}
          >
            Minimal StackView
          </Button>
          <Button 
            onClick={() => setTestMode('debug2')} 
            variant={testMode === 'debug2' ? 'default' : 'outline'}
          >
            Debug2 (Simplest)
          </Button>
          <Button 
            onClick={() => setTestMode('profile')} 
            variant={testMode === 'profile' ? 'default' : 'outline'}
          >
            Profile
          </Button>
          <Button 
            onClick={() => setTestMode('noconvex')} 
            variant={testMode === 'noconvex' ? 'default' : 'outline'}
          >
            No Convex
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Type in the textarea below and check console for render logs
        </p>
      </div>
      
      <div className="flex-1 min-h-0">
        {testMode === 'full' && firstStack ? (
          <StackView 
            stackId={firstStack._id} 
            stackName={firstStack.name} 
            cellCount={0}
          />
        ) : testMode === 'debug' && firstStack ? (
          <StackViewDebug 
            stackId={firstStack._id} 
            stackName={firstStack.name} 
            cellCount={0}
          />
        ) : testMode === 'minimal' ? (
          <StackViewMinimal />
        ) : testMode === 'debug2' ? (
          <StackViewDebug2 />
        ) : testMode === 'profile' && firstStack ? (
          <StackViewProfile 
            stackId={firstStack._id} 
            stackName={firstStack.name} 
            cellCount={0}
          />
        ) : testMode === 'noconvex' ? (
          <StackViewNoConvex />
        ) : (
          <div className="text-muted-foreground">Loading stacks...</div>
        )}
      </div>
    </div>
  )
}