package com.agon.app.security

import android.content.Context
import android.provider.Settings

/**
 * Detects Android's system-level "Private DNS" (DNS-over-TLS).
 *
 * When the user sets a **specific Private DNS hostname** (e.g. `dns.google`,
 * `1dot1dot1dot1.cloudflare-dns.com`), every DNS query leaves the device encrypted over TLS on
 * port 853 — completely outside our filtering VPN tunnel, which is a full bypass of website/DNS
 * blocking. This guard exposes that state so the app can ask the user to turn it off before the
 * protected home screen is shown.
 *
 * The check is a single, cheap read of a global setting — no service, no polling, no hot-path
 * cost. It only runs when the app is (re)opened.
 *
 * Behaviour:
 *  - mode "hostname" (a fixed private-DNS server chosen by the user) -> treated as a bypass, the
 *    guard reports active. This is the dangerous case that must be corrected.
 *  - mode "off" / "opportunistic" (Automatic) -> allowed. "Automatic" only upgrades to DoT when
 *    the current network's resolver advertises it, and does not let the user point DNS at an
 *    arbitrary unfiltered resolver, so ordinary users are never blocked here.
 */
object PrivateDnsGuard {

    /** True when a fixed Private DNS hostname is configured (the bypass case). */
    fun isBypassActive(context: Context): Boolean {
        val mode = runCatching {
            Settings.Global.getString(context.contentResolver, PRIVATE_DNS_MODE)
        }.getOrNull()
        return mode.equals(MODE_HOSTNAME, ignoreCase = true)
    }

    /** The configured Private DNS hostname, or empty when none. Shown to help the user find it. */
    fun configuredHostname(context: Context): String = runCatching {
        Settings.Global.getString(context.contentResolver, PRIVATE_DNS_SPECIFIER).orEmpty()
    }.getOrDefault("")

    // Keys are stable AOSP constants (not in the public SDK), read defensively.
    private const val PRIVATE_DNS_MODE = "private_dns_mode"
    private const val PRIVATE_DNS_SPECIFIER = "private_dns_specifier"
    private const val MODE_HOSTNAME = "hostname"
}
