import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { ArrowLeft, Check, CreditCard, Building2, Users, Zap, Brain, Target, TrendingUp, BarChart3 } from 'lucide-react';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Globe } from 'lucide-react';
import athlinkLogo from 'figma:asset/2dea44558ee75ccc34db0ab7f1dff6684b053f54.png';

interface RecruiterSignupProps {
  onComplete: () => void;
  onBack: () => void;
}

export function RecruiterSignup({ onComplete, onBack }: RecruiterSignupProps) {
  const [step, setStep] = useState<'plan' | 'account' | 'payment'>('plan');
  const [transferPortalAddon, setTransferPortalAddon] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    institution: '',
    sport: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const basePrice = 3000;
  const transferPortalPrice = 125;
  const totalPrice = basePrice + (transferPortalAddon ? transferPortalPrice : 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#2196F3] text-white p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center">
          <button onClick={step === 'plan' ? onBack : () => setStep(step === 'payment' ? 'account' : 'plan')} className="mr-4">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h2 className="text-white">
              {step === 'plan' && 'Choose Your Plan'}
              {step === 'account' && 'Create Account'}
              {step === 'payment' && 'Payment Details'}
            </h2>
            <p className="text-gray-100 text-sm">
              {step === 'plan' && 'Select your subscription plan'}
              {step === 'account' && 'Step 1 of 2'}
              {step === 'payment' && 'Step 2 of 2'}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {step !== 'plan' && (
        <div className="bg-white border-b">
          <div className="max-w-4xl mx-auto">
            <div className="h-1 bg-gray-200">
              <div 
                className="h-full bg-gradient-to-r from-[#00BCD4] to-[#2196F3] transition-all duration-300"
                style={{ width: step === 'account' ? '50%' : '100%' }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto p-6">
        {/* Plan Selection */}
        {step === 'plan' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Badge className="bg-gradient-to-r from-[#00BCD4] to-[#2196F3] text-white mb-4 px-4 py-2 text-sm border-0">
                🚀 Professional Recruiting Platform
              </Badge>
              <h1 className="text-[#2196F3] mb-2">Start Finding Top Athletes</h1>
              <p className="text-gray-600">Access unlimited international athlete profiles and AI-powered matching</p>
            </div>

            {/* Main Plan Card */}
            <Card className="p-8 rounded-2xl border-2 border-[#2196F3] shadow-xl max-w-2xl mx-auto">
              <div className="text-center mb-6">
                <Badge className="bg-gradient-to-r from-[#00BCD4] to-[#2196F3] text-white mb-4 px-4 py-2 border-0">
                  Most Popular
                </Badge>
                <h3 className="text-[#2196F3] mb-3">Monthly Recruiting Plan</h3>
                <div className="mb-4">
                  <div className="flex items-baseline justify-center">
                    <span className="text-5xl text-[#2196F3]">$3,000</span>
                    <span className="text-gray-600 ml-2">/month</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Billed monthly • Cancel anytime
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-[#FF5722] flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Unlimited athlete profile views</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-[#FF5722] flex-shrink-0 mt-0.5" />
                    <span className="text-sm">AI-powered athlete matching</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-[#FF5722] flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Direct messaging with athletes</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-[#FF5722] flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Advanced search & filters</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-[#FF5722] flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Video highlight access</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-[#FF5722] flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Academic transcript downloads</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-[#FF5722] flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Save & compare athletes</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-[#FF5722] flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Performance analytics</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-[#FF5722] flex-shrink-0 mt-0.5" />
                    <span className="text-sm">AI scouting reports</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-[#FF5722] flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Priority support</span>
                  </div>
                </div>
              </div>

              {/* AI Team Fit Analysis Add-on */}
              <div className="border-t border-gray-200 pt-6">
                <div 
                  className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
                    transferPortalAddon 
                      ? 'border-[#FF5722] bg-gradient-to-br from-orange-50 to-purple-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setTransferPortalAddon(!transferPortalAddon)}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox 
                      checked={transferPortalAddon} 
                      onCheckedChange={(checked) => setTransferPortalAddon(checked as boolean)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="w-5 h-5 text-purple-600" />
                        <h4 className="text-[#2196F3]">AI Team Fit Analysis</h4>
                        <Badge className="bg-gradient-to-r from-purple-600 to-[#FF5722] text-white text-xs">Premium AI</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Advanced AI engine that analyzes your team dynamics, public stats, and performance data to identify the perfect athlete matches for your specific needs.
                      </p>
                      <div className="grid md:grid-cols-2 gap-2 mb-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-purple-600" />
                          <span className="text-gray-700">Team dynamics analysis</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-purple-600" />
                          <span className="text-gray-700">Public stats integration</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-purple-600" />
                          <span className="text-gray-700">Position-specific matching</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-purple-600" />
                          <span className="text-gray-700">Predictive fit scoring</span>
                        </div>
                      </div>
                      
                      {/* AI Features Showcase */}
                      <div className="mt-4 p-3 bg-white rounded-lg border border-purple-100">
                        <p className="text-xs text-gray-700 mb-2">
                          <strong className="text-purple-600">AI analyzes:</strong>
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <BarChart3 className="w-3 h-3 text-blue-500" />
                            <span>Performance</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Target className="w-3 h-3 text-orange-500" />
                            <span>Team Gaps</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <TrendingUp className="w-3 h-3 text-green-500" />
                            <span>Potential</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-baseline mt-3">
                        <span className="text-2xl text-[#FF5722]">+$125</span>
                        <span className="text-gray-600 ml-2 text-sm">/month</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Price */}
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-orange-50 rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Total Monthly Price</span>
                  <div className="text-right">
                    <span className="text-3xl text-[#2196F3]">${totalPrice.toLocaleString()}</span>
                    <p className="text-sm text-gray-600">/month</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-blue-50 to-white border-[#2196F3] rounded-2xl max-w-2xl mx-auto">
              <div className="flex items-start gap-3">
                <div className="bg-[#2196F3] p-2 rounded-lg">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-[#2196F3] mb-2">Instant Access</h4>
                  <p className="text-sm text-gray-700 mb-3">
                    Get immediate access to all features upon payment. Your subscription activates instantly with full platform access. Cancel anytime with no long-term commitments.
                  </p>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="text-center p-3 bg-white rounded-lg">
                      <Users className="w-6 h-6 text-[#2196F3] mx-auto mb-1" />
                      <p className="text-xs text-gray-600">12,000+ Athletes</p>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg">
                      <Globe className="w-6 h-6 text-[#FF5722] mx-auto mb-1" />
                      <p className="text-xs text-gray-600">89 Countries</p>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg">
                      <Zap className="w-6 h-6 text-[#2196F3] mx-auto mb-1" />
                      <p className="text-xs text-gray-600">AI Matching</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <div className="max-w-2xl mx-auto">
              <Button
                onClick={() => setStep('account')}
                className="w-full h-14 bg-gradient-to-r from-[#FF5722] to-[#F4511E] hover:from-[#F4511E] hover:to-[#E64A19] text-white rounded-xl text-lg shadow-lg"
              >
                Get Started - ${totalPrice.toLocaleString()}/month
              </Button>

              <p className="text-center text-sm text-gray-500 mt-4">
                By continuing, you agree to our Terms of Service and Privacy Policy
              </p>

              {/* Stripe Badge */}
              <div className="flex items-center justify-center gap-2 mt-6 text-sm text-gray-500">
                <CreditCard className="w-4 h-4" />
                <span>Secure payment powered by</span>
                <span className="text-[#635BFF] font-semibold">Stripe</span>
              </div>
            </div>
          </div>
        )}

        {/* Account Creation */}
        {step === 'account' && (
          <Card className="p-8 rounded-2xl max-w-2xl mx-auto">
            <div className="mb-6">
              <h3 className="text-[#2196F3] mb-2">Create Your Account</h3>
              <p className="text-gray-600">Set up your recruiter profile</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Martinez"
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
                  placeholder="coach@university.edu"
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
                <Label htmlFor="institution">Institution</Label>
                <Input
                  id="institution"
                  placeholder="University of California, Los Angeles"
                  value={formData.institution}
                  onChange={(e) => handleInputChange('institution', e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div>
                <Label htmlFor="sport">Primary Sport</Label>
                <Input
                  id="sport"
                  placeholder="e.g., Football, Basketball, Soccer"
                  value={formData.sport}
                  onChange={(e) => handleInputChange('sport', e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <Button
                onClick={() => setStep('payment')}
                className="w-full h-12 bg-[#FF5722] hover:bg-[#F4511E] text-white rounded-xl"
              >
                Continue to Payment
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or sign up with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="rounded-xl">
                  Google
                </Button>
                <Button variant="outline" className="rounded-xl">
                  Microsoft
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Payment Details */}
        {step === 'payment' && (
          <Card className="p-8 rounded-2xl max-w-2xl mx-auto">
            <div className="mb-6">
              <h3 className="text-[#2196F3] mb-2">Payment Information</h3>
              <p className="text-gray-600">Complete payment to activate your subscription</p>
            </div>

            <Card className="p-4 bg-blue-50 border-blue-200 rounded-xl mb-6">
              <div className="flex items-start gap-3">
                <div className="bg-[#2196F3] p-1.5 rounded">
                  <CreditCard className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-blue-900">
                    <strong>Instant Activation</strong>
                  </p>
                  <p className="text-xs text-blue-800 mt-1">
                    Your subscription will be activated immediately upon payment. Cancel anytime.
                  </p>
                </div>
              </div>
            </Card>

            <div className="space-y-4">
              <div>
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={formData.cardNumber}
                  onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiry">Expiry Date</Label>
                  <Input
                    id="expiry"
                    placeholder="MM/YY"
                    value={formData.expiry}
                    onChange={(e) => handleInputChange('expiry', e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    value={formData.cvv}
                    onChange={(e) => handleInputChange('cvv', e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              <h4 className="text-sm text-gray-700 mb-3">Order Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Monthly Recruiting Plan</span>
                  <span className="text-gray-900">$3,000/month</span>
                </div>
                {transferPortalAddon && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">AI Team Fit Analysis Add-on</span>
                    <span className="text-gray-900">$125/month</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-gray-900">Total Due Today</span>
                    <span className="text-[#2196F3] text-lg">${totalPrice.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Then ${totalPrice.toLocaleString()}/month • Cancel anytime</p>
                </div>
              </div>
            </div>

            <Button
              onClick={onComplete}
              className="w-full h-12 bg-[#FF5722] hover:bg-[#F4511E] text-white rounded-xl mt-6"
            >
              Complete Payment & Activate - ${totalPrice.toLocaleString()}
            </Button>

            <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-500">
              <CreditCard className="w-4 h-4" />
              <span>Secure payment powered by</span>
              <span className="text-[#635BFF] font-semibold">Stripe</span>
            </div>

            <p className="text-center text-xs text-gray-500 mt-4">
              Your subscription will renew at ${totalPrice.toLocaleString()}/month. You can cancel anytime from your account settings.
            </p>

            <p className="text-center text-xs text-gray-400 mt-2">
              * Customers are responsible for any additional fees (e.g., currency conversion, international transaction fees) that may be charged by their payment provider or financial institution.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}