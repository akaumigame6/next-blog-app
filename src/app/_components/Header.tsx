"use client";
import { twMerge } from "tailwind-merge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFish } from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/utils/supabase"; // ◀ 追加
import { useAuth } from "@/app/_hooks/useAuth"; // ◀ 追加
import { useRouter } from "next/navigation"; // ◀ 追加
import Link from "next/link";

const Header: React.FC = () => {
  const router = useRouter();
  const { isLoading, session } = useAuth();
  const logout = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  return (
    <header>
      <div className="bg-teal-500 py-2 font-bold text-white">
        <div
          className={twMerge(
            "mx-4 max-w-2xl md:mx-auto",
            "flex items-center justify-between",
            "text-lg font-bold text-white"
          )}
        >
          <div>
            <FontAwesomeIcon icon={faFish} className="mr-1" />
            I&apos;Mのブログ
          </div>
          <div>
            <Link href="/">
              <FontAwesomeIcon icon={faFish} className="mr-1" />
              Header
            </Link>
          </div>
          <div>
            {!isLoading &&
              (session ? (
                <button onClick={logout} className="mx-3">
                  Logout{" "}
                </button>
              ) : (
                <Link href="/login" className="mx-3">
                  Login
                </Link>
              ))}
            <Link href="/about">
              <FontAwesomeIcon icon={faFish} className="mr-1" />
              About
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
