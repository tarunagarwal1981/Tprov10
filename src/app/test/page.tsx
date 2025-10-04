'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function CrossPlatformTest() {
  return (
    <div className="min-h-screen bg-bg-1 p-responsive">
      <div className="max-w-4xl mx-auto space-responsive">
        <h1 className="text-responsive-4xl font-bold text-neutral-900 mb-8">
          Cross-Platform Color Consistency Test
        </h1>
        
        {/* Color Palette Test */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Primary Color Palette</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              <div className="space-y-2">
                <div className="h-16 rounded-md" style={{ backgroundColor: 'var(--color-primary-50)' }}></div>
                <p className="text-xs text-neutral-600">Primary 50</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 rounded-md" style={{ backgroundColor: 'var(--color-primary-200)' }}></div>
                <p className="text-xs text-neutral-600">Primary 200</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 rounded-md" style={{ backgroundColor: 'var(--color-primary-500)' }}></div>
                <p className="text-xs text-white">Primary 500</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 rounded-md" style={{ backgroundColor: 'var(--color-primary-700)' }}></div>
                <p className="text-xs text-white">Primary 700</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 rounded-md" style={{ backgroundColor: 'var(--color-primary-950)' }}></div>
                <p className="text-xs text-white">Primary 950</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Neutral Color Test */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Neutral Color Palette</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              <div className="space-y-2">
                <div className="h-16 rounded-md border" style={{ backgroundColor: 'var(--color-neutral-50)' }}></div>
                <p className="text-xs text-neutral-600">Neutral 50</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 rounded-md border" style={{ backgroundColor: 'var(--color-neutral-200)' }}></div>
                <p className="text-xs text-neutral-600">Neutral 200</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 rounded-md border" style={{ backgroundColor: 'var(--color-neutral-500)' }}></div>
                <p className="text-xs text-white">Neutral 500</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 rounded-md border" style={{ backgroundColor: 'var(--color-neutral-700)' }}></div>
                <p className="text-xs text-white">Neutral 700</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 rounded-md border" style={{ backgroundColor: 'var(--color-neutral-950)' }}></div>
                <p className="text-xs text-white">Neutral 950</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Button Test */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Button Color Consistency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button className="btn btn-primary btn-md">Primary Button</Button>
              <Button className="btn btn-secondary btn-md">Secondary Button</Button>
              <Button className="btn btn-ghost btn-md">Ghost Button</Button>
              <Button className="btn btn-success btn-md">Success Button</Button>
              <Button className="btn btn-warning btn-md">Warning Button</Button>
              <Button className="btn btn-error btn-md">Error Button</Button>
            </div>
          </CardContent>
        </Card>

        {/* Text Rendering Test */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Font Rendering Consistency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h2 className="text-responsive-2xl font-semibold text-neutral-900 mb-2">
                  Large Heading Text
                </h2>
                <p className="text-responsive-base text-neutral-600">
                  This text should render consistently across Windows and macOS with proper font smoothing and kerning.
                </p>
              </div>
              
              <div>
                <h3 className="text-responsive-xl font-medium text-neutral-800 mb-2">
                  Medium Heading Text
                </h3>
                <p className="text-responsive-sm text-neutral-500">
                  Smaller text should maintain readability and consistent color appearance across platforms.
                </p>
              </div>

              <div>
                <h4 className="text-responsive-lg font-medium text-neutral-700 mb-2">
                  Small Heading Text
                </h4>
                <p className="text-responsive-xs text-neutral-400">
                  Very small text should remain legible and maintain proper contrast ratios.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Input Test */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Input Field Consistency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Default Input
                </label>
                <Input className="input" placeholder="Enter text here..." />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Success Input
                </label>
                <Input className="input input-success" placeholder="Success state..." />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Error Input
                </label>
                <Input className="input input-error" placeholder="Error state..." />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Badge Test */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Badge Color Consistency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="default">Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Glass Effect Test */}
        <Card className="card-glass">
          <CardHeader>
            <CardTitle>Glass Morphism Effect</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-neutral-700">
              This card uses glass morphism with backdrop blur. The effect should render consistently across platforms.
            </p>
          </CardContent>
        </Card>

        {/* Platform Detection */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Platform Detection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-neutral-600">
                User Agent: {typeof window !== 'undefined' ? navigator.userAgent : 'Server-side'}
              </p>
              <p className="text-sm text-neutral-600">
                Platform: {typeof window !== 'undefined' ? navigator.platform : 'Server-side'}
              </p>
              <p className="text-sm text-neutral-600">
                Color Scheme: {typeof window !== 'undefined' ? 
                  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'Dark' : 'Light' 
                  : 'Server-side'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
