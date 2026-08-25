import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SignupForm from '../components/SignUpForm';

export default function SignupPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow flex items-center justify-center py-10 bg-gray-50">
        <SignupForm />
      </main>
      <Footer />
    </div>
  );
}