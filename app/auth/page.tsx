"use client"

import type React from "react"

import { useState } from "react"
import { auth, db } from "@/lib/firebase"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { toast } from "sonner"
import Cookies from "js-cookie"
import { useRouter } from "next/navigation"

export default function AuthPage() {
  const [isRegister, setIsRegister] = useState(true)
  const router = useRouter()

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    company: "",
    email: "",
    phone: "",
    currency: "USD",
    password: "",
    acceptTerms: false,
  })

  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)

      if (isRegister) {
        if (!formData.acceptTerms) {
          toast.error("Siz oferta shartnomasini qabul qilishingiz kerak.")
          return
        }

        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password)

        const token = await userCredential.user.getIdToken()
        Cookies.set("firebaseToken", token, { expires: 7, path: "/" })

        await setDoc(doc(db, "users", userCredential.user.uid), {
          firstName: formData.firstName,
          lastName: formData.lastName,
          company: formData.company,
          email: formData.email,
          phone: formData.phone,
          currency: formData.currency,
          createdAt: serverTimestamp(),
        })

        toast.success("Ro'yxatdan muvaffaqiyatli o'tdingiz!")
        router.push("/")
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password)

        const token = await userCredential.user.getIdToken()
        Cookies.set("firebaseToken", token, { expires: 1, path: "/" })

        toast.success("Tizimga muvaffaqiyatli kirdingiz!")
        router.push("/")
      }
    } catch (err) {
      toast.error("Email yoki parol noto‘g‘ri yoki boshqa xatolik")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      company: "",
      email: "",
      phone: "",
      currency: "USD",
      password: "",
      acceptTerms: false,
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">{isRegister ? "Ro'yxatdan o'tish" : "Kirish"}</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <>
              <input
                type="text"
                name="firstName"
                placeholder="Ism"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="w-full border p-2 rounded"
              />
              <input
                type="text"
                name="lastName"
                placeholder="Familiya"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="w-full border p-2 rounded"
              />
              <input
                type="text"
                name="company"
                placeholder="Firma nomi"
                value={formData.company}
                onChange={handleChange}
                required
                className="w-full border p-2 rounded"
              />
              <input
                type="tel"
                name="phone"
                placeholder="Telefon raqam"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full border p-2 rounded"
              />
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              >
                <option value="USD">USD</option>
                <option value="UZS">UZS</option>
              </select>
            </>
          )}

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
          />
          <input
            type="password"
            name="password"
            placeholder="Parol"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
          />

          {isRegister && (
            <div className="flex items-center space-x-2">
              <input type="checkbox" name="acceptTerms" checked={formData.acceptTerms} onChange={handleChange} />
              <label>
                <a href="/oferta" target="_blank" className="text-blue-600 underline" rel="noreferrer">
                  Oferta shartnomasini
                </a>{" "}
                o&apos;qib chiqdim va qabul qilaman
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
          >
            {loading ? "Yuklanmoqda..." : isRegister ? "Ro'yxatdan o'tish" : "Kirish"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm">
          {isRegister ? (
            <>
              Akkauntingiz bormi?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false)
                  resetForm()
                }}
                className="text-blue-600 underline"
              >
                Kirish
              </button>
            </>
          ) : (
            <>
              Akkaunt yo&apos;qmi?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(true)
                  resetForm()
                }}
                className="text-blue-600 underline"
              >
                Ro&apos;yxatdan o&apos;tish
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
