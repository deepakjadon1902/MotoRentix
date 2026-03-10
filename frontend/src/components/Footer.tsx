import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import logo from '@/assets/logo.png';

const Footer = () => {
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  return (
    <>
      <footer className="bg-foreground text-background">
        <div className="container mx-auto px-4 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            <div className="flex flex-col gap-3">
              <img src={logo} alt="MotoRentix" className="h-12 w-auto self-start brightness-0 invert" />
              <p className="text-sm opacity-70 max-w-xs">
                Ride the future. Premium bikes & scooters on rent — anytime, anywhere.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <h4 className="font-heading font-semibold text-lg mb-2">Quick Links</h4>
              <Link to="/about" className="text-sm opacity-70 hover:opacity-100 transition-opacity">About</Link>
              <Link to="/contact" className="text-sm opacity-70 hover:opacity-100 transition-opacity">Contact</Link>
              <button onClick={() => setShowTerms(true)} className="text-sm opacity-70 hover:opacity-100 transition-opacity text-left">Terms of Service</button>
              <button onClick={() => setShowPrivacy(true)} className="text-sm opacity-70 hover:opacity-100 transition-opacity text-left">Privacy Policy</button>
            </div>

            <div className="flex flex-col gap-2">
              <h4 className="font-heading font-semibold text-lg mb-2">Contact</h4>
              <p className="text-sm opacity-70">support@motorentix.com</p>
              <p className="text-sm opacity-70">+91 98765 43210</p>
              <p className="text-sm opacity-70">Bangalore, India</p>
            </div>
          </div>

          <div className="border-t border-background/10 mt-10 pt-6 text-center">
            <p className="text-sm opacity-50">© 2026 MotoRentix. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">Terms of Service</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p><strong>1. Acceptance of Terms</strong><br/>By using MotoRentix, you agree to these terms. All rentals are subject to vehicle availability.</p>
            <p><strong>2. Eligibility</strong><br/>You must be 18+ with a valid driving license and Aadhaar card to rent vehicles.</p>
            <p><strong>3. Rental Policy</strong><br/>Vehicles must be returned on time and in the same condition. Late fees may apply.</p>
            <p><strong>4. Payment</strong><br/>All payments are non-refundable unless the booking is cancelled 24 hours in advance.</p>
            <p><strong>5. Liability</strong><br/>Users are responsible for any damage, fines or accidents during the rental period.</p>
            <p><strong>6. Modifications</strong><br/>MotoRentix reserves the right to modify these terms at any time.</p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPrivacy} onOpenChange={setShowPrivacy}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">Privacy Policy</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p><strong>1. Data Collection</strong><br/>We collect personal info (name, email, Aadhaar) solely for rental verification and communication.</p>
            <p><strong>2. Data Usage</strong><br/>Your data is used to process bookings, verify identity, and improve our services.</p>
            <p><strong>3. Data Protection</strong><br/>We employ industry-standard encryption and security measures to protect your data.</p>
            <p><strong>4. Third Parties</strong><br/>We do not sell or share your personal data with third parties without consent.</p>
            <p><strong>5. Contact</strong><br/>For privacy concerns, email us at privacy@motorentix.com.</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Footer;
