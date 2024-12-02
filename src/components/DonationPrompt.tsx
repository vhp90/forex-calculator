'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon } from '@heroicons/react/24/outline'

declare global {
  interface Window {
    disableSupportButton?: boolean;
  }
}

const CoffeeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
    <line x1="6" y1="1" x2="6" y2="4" />
    <line x1="10" y1="1" x2="10" y2="4" />
    <line x1="14" y1="1" x2="14" y2="4" />
  </svg>
)

type ButtonType = 'primary' | 'secondary' | 'success';

export default function DonationPrompt() {
  const [showPopup, setShowPopup] = useState(false)
  const [hasShownPopup, setHasShownPopup] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [hasScrolledUp, setHasScrolledUp] = useState(false)
  const donationLink = process.env.NEXT_PUBLIC_DONATION_LINK || 'https://buymeacoffee.com/vhp327'

  const handleClose = () => {
    setShowPopup(false)
  }

  const logDonationClick = (type: 'fixed-button' | 'popup'): boolean => {
    // Add logging functionality here
    return true; // Ensure a value is returned
  }

  useEffect(() => {
    // Don't show in admin pages
    if (window.disableSupportButton) {
      return;
    }

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    handleResize()
    window.addEventListener('resize', handleResize)

    // Show popup after 45 seconds if not shown before
    if (!hasShownPopup) {
      const timer = setTimeout(() => {
        setShowPopup(true)
        setHasShownPopup(true)
      }, 45000)
      return () => {
        clearTimeout(timer)
        window.removeEventListener('resize', handleResize)
      }
    }

    return () => window.removeEventListener('resize', handleResize)
  }, [hasShownPopup])

  // Handle scroll behavior
  useEffect(() => {
    if (!isMobile) return

    let lastScrollY = window.scrollY
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const isScrollingUp = currentScrollY < lastScrollY
      const isNearBottom = window.innerHeight + currentScrollY >= document.documentElement.scrollHeight - 100

      if (isNearBottom) {
        setIsCollapsed(false)
        setHasScrolledUp(false)
      } else if (isScrollingUp && !hasScrolledUp) {
        setHasScrolledUp(true)
        setIsCollapsed(true)
      }

      lastScrollY = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isMobile, hasScrolledUp])

  // Setup popup timer
  useEffect(() => {
    // Only show popup after 5 minutes if it hasn't been shown before
    if (!hasShownPopup) {
      const timer = setTimeout(() => {
        setShowPopup(true)
        setHasShownPopup(true)
      }, 5 * 60 * 1000)

      return () => clearTimeout(timer)
    }
    return () => {} // Add explicit return for the case when hasShownPopup is true
  }, [hasShownPopup])

  const getButtonStyle = (type: ButtonType): string => {
    switch (type) {
      case 'primary':
        return 'bg-blue-600 hover:bg-blue-700 text-white';
      case 'secondary':
        return 'bg-gray-200 hover:bg-gray-300 text-gray-800';
      case 'success':
        return 'bg-green-600 hover:bg-green-700 text-white';
      default:
        return 'bg-gray-200 hover:bg-gray-300 text-gray-800';
    }
  };

  // Don't render anything in admin pages
  if (typeof window !== 'undefined' && window.disableSupportButton) {
    return null;
  }

  return (
    <>
      {/* Donation button */}
      <motion.div
        initial={false}
        animate={{
          scale: isCollapsed ? 0.8 : 1,
          bottom: isCollapsed ? '20px' : '0',
          right: isCollapsed ? '20px' : '0',
          position: isCollapsed || !isMobile ? 'fixed' : 'static',
          margin: !isCollapsed && isMobile ? '20px 0' : '0'
        }}
        transition={{ duration: 0.3 }}
        className={`flex justify-center ${isCollapsed ? 'z-50' : ''}`}
      >
        <motion.a
          href={donationLink}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center ${
            isCollapsed 
              ? 'p-3 rounded-full shadow-lg bg-yellow-500 text-gray-900 hover:bg-yellow-400'
              : 'px-4 py-2 bg-yellow-500 text-gray-900 rounded-lg font-medium hover:bg-yellow-400 transition-colors shadow-lg'
          }`}
          onClick={() => logDonationClick('fixed-button')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <CoffeeIcon />
          {!isCollapsed && <span className="ml-2">Support Me</span>}
        </motion.a>
      </motion.div>

      {/* Popup */}
      <AnimatePresence>
        {showPopup && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed ${isCollapsed ? 'bottom-36' : 'bottom-24'} right-4 p-6 bg-gray-800 border border-yellow-500/20 rounded-xl shadow-lg max-w-sm z-50`}
          >
            <button
              onClick={handleClose}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-300"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
            <div className="text-center">
              <h3 className="text-xl font-bold text-yellow-500 mb-2">
                Enjoying the Calculator? 🎉
              </h3>
              <p className="text-gray-300 mb-4">
                Hi! I'm the solo developer behind this tool. If you find it helpful, consider buying me a coffee to keep me coding! 
              </p>
              <div className="flex justify-center">
                <motion.a
                  href={donationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center px-4 py-2 ${getButtonStyle('primary')} font-medium hover:bg-yellow-400 transition-colors`}
                  onClick={() => {
                    logDonationClick('popup');
                    handleClose();
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <CoffeeIcon />
                  <span className="ml-2">Buy Me a Coffee</span>
                </motion.a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
