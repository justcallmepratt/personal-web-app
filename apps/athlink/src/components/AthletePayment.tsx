import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { ArrowLeft, CreditCard, Check } from 'lucide-react';
import { Badge } from './ui/badge';

interface AthletePaymentProps {
  onComplete: () => void;
  onBack: () => void;
}

export function AthletePayment({ onComplete, onBack }: AthletePaymentProps) {
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#2196F3] text-white p-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center">
          <button onClick={onBack} className="mr-4">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h2 className="text-white">Complete Your Registration</h2>
            <p className="text-gray-100 text-sm">Secure your athlete profile</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6">
        <Card className="p-8 rounded-2xl">
          <div className="mb-6">
            <Badge className="bg-gradient-to-r from-[#00BCD4] to-[#2196F3] text-white mb-4 px-4 py-2">
              Monthly Subscription
            </Badge>
            <h3 className="text-[#2196F3] mb-2">Athlete Membership</h3>
            <p className="text-gray-600">Get full access to connect with recruiters worldwide</p>
          </div>

          <Card className="p-6 bg-gradient-to-br from-[#2196F3]/5 to-[#00BCD4]/5 border-2 border-[#2196F3]/20 rounded-2xl mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-700">Monthly Membership</span>
              <div className="text-right">
                <p className="text-3xl text-[#2196F3]">$9.99</p>
                <p className="text-sm text-gray-600">/month</p>
              </div>
            </div>
            <div className="space-y-2 pt-4 border-t border-[#2196F3]/20">
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-[#00BCD4]" />
                <span>Unlimited video uploads</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-[#00BCD4]" />
                <span>Connect with unlimited recruiters</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-[#00BCD4]" />
                <span>AI-powered college matching</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-[#00BCD4]" />
                <span>Performance analytics dashboard</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-[#00BCD4]" />
                <span>Direct messaging with coaches</span>
              </div>
            </div>
          </Card>

          <div className="space-y-4 mb-6">
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

          <div className="bg-gray-50 p-4 rounded-xl mb-6">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-5 h-5 text-[#2196F3]" />
              <h4 className="text-sm text-gray-700">Order Summary</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Monthly Membership</span>
                <span className="text-gray-900">$9.99</span>
              </div>
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-gray-900">Total Due Today</span>
                  <span className="text-[#2196F3] text-lg">$9.99</span>
                </div>
              </div>
            </div>
          </div>

          <Button
            onClick={onComplete}
            className="w-full h-12 bg-gradient-to-r from-[#00BCD4] to-[#2196F3] hover:from-[#00ACC1] hover:to-[#1976D2] text-white rounded-xl"
          >
            Complete Registration - $9.99
          </Button>

          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-500">
            <CreditCard className="w-4 h-4" />
            <span>Secure payment powered by</span>
            <span className="text-[#635BFF] font-semibold">Stripe</span>
          </div>

          <p className="text-center text-xs text-gray-500 mt-3">
            Your membership will automatically renew monthly. Cancel anytime from your account settings.
          </p>

          <p className="text-center text-xs text-gray-400 mt-2">
            * Customers are responsible for any additional fees (e.g., currency conversion, international transaction fees) that may be charged by their payment provider or financial institution.
          </p>
        </Card>
      </div>
    </div>
  );
}