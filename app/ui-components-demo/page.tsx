"use client"

import React from 'react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'

export default function UIComponentsDemo() {
  const [progress, setProgress] = React.useState(13)
  const [isChecked, setIsChecked] = React.useState(false)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(66)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Alerts</h2>
        <div className="space-y-4">
          <Alert>
            <AlertTitle>Default Alert</AlertTitle>
            <AlertDescription>
              This is a default alert with some information.
            </AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertTitle>Error Alert</AlertTitle>
            <AlertDescription>
              Something went wrong! Please try again.
            </AlertDescription>
          </Alert>
        </div>
      </div>

      <Separator />

      <div>
        <h2 className="text-2xl font-bold mb-4">Badges</h2>
        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="pending">Pending</Badge>
        </div>
      </div>

      <Separator />

      <div>
        <h2 className="text-2xl font-bold mb-4">Dialog</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dialog Title</DialogTitle>
              <DialogDescription>
                This is a description of the dialog. It provides context about what this dialog is for.
              </DialogDescription>
            </DialogHeader>
            <p className="py-4">Dialog content goes here. This could be a form, information, or any other content.</p>
            <DialogFooter>
              <Button variant="outline">Cancel</Button>
              <Button>Continue</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Separator />

      <div>
        <h2 className="text-2xl font-bold mb-4">Switch</h2>
        <div className="flex items-center space-x-2">
          <Switch id="airplane-mode" checked={isChecked} onCheckedChange={setIsChecked} />
          <label htmlFor="airplane-mode" className="text-sm font-medium">
            {isChecked ? 'On' : 'Off'}
          </label>
        </div>
      </div>

      <Separator />

      <div>
        <h2 className="text-2xl font-bold mb-4">Progress</h2>
        <Progress value={progress} className="w-full" />
        <p className="text-sm text-gray-500 mt-2">Progress: {progress}%</p>
      </div>
    </div>
  )
}
