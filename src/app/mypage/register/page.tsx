"use client";
import { useState } from "react";
import apiClient from "../../lib/apiClient";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    nickname: "",
    password: "",
    provider_type: "email",
    provider_id: "",
    provider_email: "",
    profile_image_url: "",
    region: "",
    gender: "",
    birth_year: "",
    personality_type: "",
    interests: "",
    hobbies: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      const payload = {
        email: form.email,
        nickname: form.nickname,
        provider_type: "email",
        provider_id: form.email,
        provider_email: form.email,
        password: form.password,
        profile_image_url: form.profile_image_url || null,
        region: form.region || null,
        gender: form.gender || null,
        birth_year: form.birth_year || null,
        personality_type: form.personality_type || null,
        interests: form.interests ? form.interests.split(",").map((s) => s.trim()) : [],
        hobbies: form.hobbies ? form.hobbies.split(",").map((s) => s.trim()) : [],
      };
      await apiClient.post("/auth/register", payload);
      setSuccess(true);
      setTimeout(() => router.push("/mypage"), 1500);
    } catch (e: any) {
      setError(e?.response?.data?.message || "회원가입에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
      <form
        className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 flex flex-col gap-4 border border-blue-100"
        onSubmit={handleSubmit}
      >
        <h2 className="text-2xl font-bold text-black mb-2 text-center">회원가입</h2>
        <input
          name="email"
          type="email"
          required
          placeholder="이메일"
          className="border rounded px-3 py-2 text-black placeholder-gray-400"
          value={form.email}
          onChange={handleChange}
        />
        <input
          name="nickname"
          type="text"
          required
          placeholder="닉네임"
          className="border rounded px-3 py-2 text-black placeholder-gray-400"
          value={form.nickname}
          onChange={handleChange}
        />
        <input
          name="password"
          type="password"
          required
          placeholder="비밀번호"
          className="border rounded px-3 py-2 text-black placeholder-gray-400"
          value={form.password}
          onChange={handleChange}
        />
        <input
          name="profile_image_url"
          type="text"
          placeholder="프로필 이미지 URL (선택)"
          className="border rounded px-3 py-2 text-black placeholder-gray-400"
          value={form.profile_image_url}
          onChange={handleChange}
        />
        
        <select
          name="gender"
          className="border rounded px-3 py-2 text-gray-400 bg-white"
          value={form.gender}
          onChange={handleChange}
        >
          <option value="">성별 (선택)</option>
          <option value="male">남성</option>
          <option value="female">여성</option>
          <option value="other">기타</option>
        </select>
        <input
          name="birth_year"
          type="number"
          placeholder="출생년도 (선택)"
          className="border rounded px-3 py-2 text-black placeholder-gray-400"
          value={form.birth_year}
          onChange={handleChange}
        />
        <input
          name="personality_type"
          type="text"
          placeholder="성격 유형 (선택)"
          className="border rounded px-3 py-2 text-black placeholder-gray-400"
          value={form.personality_type}
          onChange={handleChange}
        />
        <input
          name="interests"
          type="text"
          placeholder="관심사 (콤마로 구분, 선택)"
          className="border rounded px-3 py-2 text-black placeholder-gray-400"
          value={form.interests}
          onChange={handleChange}
        />
        <input
          name="hobbies"
          type="text"
          placeholder="취미 (콤마로 구분, 선택)"
          className="border rounded px-3 py-2 text-black placeholder-gray-400"
          value={form.hobbies}
          onChange={handleChange}
        />
        {error && <div className="text-red-600 text-sm text-center">{error}</div>}
        {success && <div className="text-green-700 text-sm text-center">회원가입이 완료되었습니다! 잠시 후 로그인 페이지로 이동합니다.</div>}
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 rounded mt-2 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "가입 중..." : "회원가입"}
        </button>
      </form>
    </div>
  );
} 