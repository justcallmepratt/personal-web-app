import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, Upload, Camera } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import athlinkLogo from 'figma:asset/2dea44558ee75ccc34db0ab7f1dff6684b053f54.png';

interface AthleteOnboardingProps {
  onComplete: (profile: any) => void;
  onBack: () => void;
}

export function AthleteOnboarding({ onComplete, onBack }: AthleteOnboardingProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    sport: '',
    position: '',
    country: '',
    highSchool: '',
    profilePicture: null as string | null,
    height: '',
    weight: '',
    yearOfGraduation: '',
    phone: '',
    jerseyNumber: '',
    dominantSide: '',
    gamesPlayed: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (field: string) => {
    // Mock file upload
    if (field === 'profilePicture') {
      setFormData(prev => ({ ...prev, profilePicture: 'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=400' }));
    }
  };

  const handleNext = () => {
    if (step === 1) setStep(2);
    else if (step === 2) setStep(3);
    else if (step === 3) {
      onComplete(formData);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-[#2196F3] text-white p-4 sticky top-0 z-10">
        <div className="max-w-md mx-auto flex items-center">
          <button onClick={step === 1 ? onBack : () => setStep(step - 1)} className="mr-4">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h2 className="text-white">
              {step === 1 && 'Create Account'}
              {step === 2 && 'Profile Setup'}
              {step === 3 && 'Performance & Stats'}
            </h2>
            <p className="text-gray-100 text-sm">Step {step} of 3</p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-md mx-auto">
          <div className="h-1 bg-gray-200">
            <div 
              className="h-full bg-gradient-to-r from-[#00BCD4] to-[#2196F3] transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4">
        {step === 1 && (
          <Card className="p-6 space-y-6 rounded-2xl">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[#2196F3]">Sign Up as Athlete</h3>
                <Badge className="bg-gradient-to-r from-[#00BCD4] to-[#2196F3] text-white">$9.99/mo</Badge>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="John Smith"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="athlete@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <Label htmlFor="sport">Sport</Label>
                  <Select value={formData.sport} onValueChange={(value) => handleInputChange('sport', value)}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select sport" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="football">Football</SelectItem>
                      <SelectItem value="basketball">Basketball</SelectItem>
                      <SelectItem value="soccer">Soccer</SelectItem>
                      <SelectItem value="baseball">Baseball</SelectItem>
                      <SelectItem value="volleyball">Volleyball</SelectItem>
                      <SelectItem value="track">Track & Field</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    placeholder="e.g., Quarterback, Point Guard"
                    value={formData.position}
                    onChange={(e) => handleInputChange('position', e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 space-y-3">
              <Button 
                onClick={handleNext}
                className="w-full h-12 bg-gradient-to-r from-[#00BCD4] to-[#2196F3] hover:from-[#00ACC1] hover:to-[#1976D2] text-white rounded-xl"
              >
                Continue
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="rounded-xl">
                  Google
                </Button>
                <Button variant="outline" className="rounded-xl">
                  Apple
                </Button>
              </div>
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card className="p-6 space-y-6 rounded-2xl">
            <div>
              <h3 className="text-[#2196F3] mb-4">Profile Setup</h3>
              
              <div className="space-y-6">
                <div className="flex flex-col items-center">
                  {formData.profilePicture ? (
                    <img 
                      src={formData.profilePicture} 
                      alt="Profile" 
                      className="w-24 h-24 rounded-full object-cover mb-3"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center mb-3">
                      <Camera className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <Button 
                    variant="outline" 
                    onClick={() => handleFileUpload('profilePicture')}
                    className="rounded-xl"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Photo
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="height">Height</Label>
                    <Input
                      id="height"
                      placeholder="6'2&quot;"
                      value={formData.height}
                      onChange={(e) => handleInputChange('height', e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="weight">Weight (lbs)</Label>
                    <Input
                      id="weight"
                      placeholder="180"
                      value={formData.weight}
                      onChange={(e) => handleInputChange('weight', e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="highSchool">High School</Label>
                  <Input
                    id="highSchool"
                    placeholder="Lincoln High School"
                    value={formData.highSchool}
                    onChange={(e) => handleInputChange('highSchool', e.target.value)}
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <Label htmlFor="yearOfGraduation">Year of Graduation</Label>
                  <Input
                    id="yearOfGraduation"
                    placeholder="2025"
                    value={formData.yearOfGraduation}
                    onChange={(e) => handleInputChange('yearOfGraduation', e.target.value)}
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <Label htmlFor="country">Country</Label>
                  <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usa">United States</SelectItem>
                      <SelectItem value="brazil">Brazil</SelectItem>
                      <SelectItem value="japan">Japan</SelectItem>
                      <SelectItem value="canada">Canada</SelectItem>
                      <SelectItem value="mexico">Mexico</SelectItem>
                      <SelectItem value="uk">United Kingdom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="+1 (555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <Label>Transcript (PDF)</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#00BCD4] transition-colors cursor-pointer">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-500">PDF up to 10MB</p>
                  </div>
                </div>

                <div>
                  <Label>Recommendation Letter (PDF)</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#00BCD4] transition-colors cursor-pointer">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-500">PDF up to 10MB</p>
                  </div>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleNext}
              className="w-full h-12 bg-gradient-to-r from-[#00BCD4] to-[#2196F3] hover:from-[#00ACC1] hover:to-[#1976D2] text-white rounded-xl"
            >
              Continue
            </Button>
          </Card>
        )}

        {step === 3 && (
          <Card className="p-6 space-y-6 rounded-2xl">
            <div>
              <h3 className="text-[#2196F3] mb-4">Performance & Stats</h3>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="jerseyNumber">Jersey Number</Label>
                    <Input
                      id="jerseyNumber"
                      placeholder="23"
                      value={formData.jerseyNumber}
                      onChange={(e) => handleInputChange('jerseyNumber', e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dominantSide">Dominant Side</Label>
                    <Select value={formData.dominantSide} onValueChange={(value) => handleInputChange('dominantSide', value)}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="right">Right</SelectItem>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="gamesPlayed">Games Played (This Season)</Label>
                  <Input
                    id="gamesPlayed"
                    placeholder="24"
                    value={formData.gamesPlayed}
                    onChange={(e) => handleInputChange('gamesPlayed', e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>

            <Button 
              onClick={handleNext}
              className="w-full h-12 bg-gradient-to-r from-[#00BCD4] to-[#2196F3] hover:from-[#00ACC1] hover:to-[#1976D2] text-white rounded-xl"
            >
              Complete Setup - Start Free!
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}