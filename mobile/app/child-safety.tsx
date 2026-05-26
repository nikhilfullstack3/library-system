import { Link } from "expo-router";
import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

const CONTACT_EMAIL = "support@librarysystem.app";
const EFFECTIVE_DATE = "May 26, 2026";
const sections = [
  {
    title: "1. Our Commitment",
    body: [
      "LibHook strictly prohibits any content, behaviour, or communication involving child sexual abuse and exploitation (CSAE).",
      "We comply with Google Play's policies and applicable laws to keep the platform safe for all users.",
      "This policy applies to both the mobile app and web service.",
    ],
  },
  {
    title: "2. Prohibited Conduct",
    body: [
      "Users may not upload, share, request, or promote any CSAE content or abusive material.",
      "Any imagery, text, or links depicting sexualised minors, exploitation, or abuse is strictly forbidden.",
      "Accounts that violate this policy may be suspended or removed without warning.",
    ],
  },
  {
    title: "3. Reporting and Response",
    body: [
      "If you encounter suspected CSAE content, report it immediately to our support team.",
      "We will remove reported material, investigate the account, and cooperate with law enforcement as required.",
      "Please send reports to the email address below with as much detail as possible.",
    ],
  },
  {
    title: "4. Monitoring and Enforcement",
    body: [
      "We maintain a zero-tolerance approach to CSAE and related abusive behaviour.",
      "The platform may monitor submitted content and account activity for policy compliance.",
      "Violations may result in account termination, content removal, and notification of authorities.",
    ],
  },
];

export default function ChildSafetyScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Child Safety Policy</Text>
          <Text style={styles.subtitle}>Effective date: {EFFECTIVE_DATE}</Text>
        </View>

        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.body.map((line) => (
              <Text key={line} style={styles.sectionText}>
                {line}
              </Text>
            ))}
          </View>
        ))}

        <View style={styles.reportBox}>
          <Text style={styles.sectionTitle}>Report concerns</Text>
          <Text style={styles.sectionText}>
            To report suspected CSAE or any safety concern, email us at {CONTACT_EMAIL}.
          </Text>
        </View>

        <Link href="/login" style={styles.link}>
          Back to login
        </Link>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scroll: {
    padding: 24,
    paddingBottom: 40,
    backgroundColor: "#f8fafc",
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#475569",
  },
  section: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 10,
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#475569",
    marginBottom: 8,
  },
  reportBox: {
    backgroundColor: "#ecfdf5",
    borderRadius: 24,
    padding: 18,
    marginTop: 8,
  },
  link: {
    marginTop: 20,
    color: "#047857",
    fontWeight: "700",
    textAlign: "center",
  },
});
