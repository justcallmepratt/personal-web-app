package com.resume.market;

import com.resume.market.AllowList.Company;
import com.resume.market.AllowList.Entry;
import com.resume.market.AllowList.FinraFirm;
import com.resume.market.AllowList.Fortune500;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AllowListTest {

    private static final Fortune500 RANKED = new Fortune500(12, 2026, "https://fortune.test");
    private static final List<FinraFirm> MEMBER = List.of(new FinraFirm("Example Securities LLC", 79L, "https://brokercheck.test"));

    private static Entry entry(String name, Boolean included, Fortune500 fortune, List<FinraFirm> finra, String... aliases) {
        return new Entry(name, included, fortune, finra, null, Arrays.asList(aliases), null, null);
    }

    // ── which entries count ──────────────────────────────────────────────────

    @Test
    void anEntryCountsOnlyWhenIncludedAndBothPiecesOfEvidenceArePresent() {
        List<Entry> entries = new ArrayList<>();
        entries.add(entry("Good Bank", true, RANKED, MEMBER, "good bank"));
        entries.add(null);
        entries.add(entry("Switched Off", false, RANKED, MEMBER, "switched off"));
        entries.add(entry("No Flag", null, RANKED, MEMBER, "no flag"));
        entries.add(entry("No Fortune", true, null, MEMBER, "no fortune"));
        entries.add(entry("No Rank", true, new Fortune500(null, 2026, "x"), MEMBER, "no rank"));
        entries.add(entry("Rank 501", true, new Fortune500(501, 2026, "x"), MEMBER, "rank 501"));
        entries.add(entry("Rank 0", true, new Fortune500(0, 2026, "x"), MEMBER, "rank 0"));
        entries.add(entry("No Finra", true, RANKED, null, "no finra"));
        entries.add(entry("Empty Finra", true, RANKED, List.of(), "empty finra"));
        entries.add(entry("No Crd", true, RANKED, List.of(new FinraFirm("Firm", null, "x")), "no crd"));
        entries.add(entry("Zero Crd", true, RANKED, List.of(new FinraFirm("Firm", 0L, "x")), "zero crd"));
        entries.add(entry("No Firm Name", true, RANKED, List.of(new FinraFirm(" ", 5L, "x")), "no firm name"));
        entries.add(entry("Null Firm", true, RANKED, Arrays.asList((FinraFirm) null), "null firm"));
        entries.add(entry("Null Firm Name", true, RANKED, List.of(new FinraFirm(null, 5L, "x")), "null firm name"));
        entries.add(entry(" ", true, RANKED, MEMBER, "nameless"));
        entries.add(entry(null, true, RANKED, MEMBER, "nameless too"));
        entries.add(entry("No Aliases", true, RANKED, MEMBER));
        entries.add(new Entry("Null Aliases", true, RANKED, MEMBER, null, null, null, null));
        entries.add(entry("Blank Aliases", true, RANKED, MEMBER, " ", "&", null));
        entries.add(entry("Rank 500", true, new Fortune500(500, 2026, "x"),
                List.of(new FinraFirm("Firm", null, "x"), new FinraFirm("Other Firm", 9L, "x")), "rank 500"));

        AllowList list = AllowList.of("2026-11-21", entries);

        assertThat(list.companies()).extracting(Company::name).containsExactly("Good Bank", "Rank 500");
        assertThat(list.compiledOn()).isEqualTo("2026-11-21");
        assertThat(list.loadError()).isNull();
        assertThat(AllowList.of(null, null).companies()).isEmpty();
    }

    @Test
    void theSearchNameDefaultsToTheCompanyName_andAliasesAreNormalised() {
        AllowList list = AllowList.of("2026-11-21", List.of(
                new Entry(" Example Financial ", true, RANKED, MEMBER, " ", List.of("Example  & Co.", "EXAMPLE-BANK"), null, null),
                new Entry("JPMorgan Chase", true, RANKED, MEMBER, " JPMorgan Chase & Co ", List.of("jpmorgan"), null, null)));

        Company first = list.companies().get(0);
        assertThat(first.name()).isEqualTo("Example Financial");
        assertThat(first.searchName()).isEqualTo("Example Financial");
        assertThat(first.aliases()).containsExactlyInAnyOrder("example co", "example bank");
        assertThat(list.companies().get(1).searchName()).isEqualTo("JPMorgan Chase & Co");
    }

    // ── matching a listing's employer ────────────────────────────────────────

    @Test
    void anEmployerMatchesWhenItContainsAnAliasAsWholeWords() {
        Company citi = AllowList.of("x", List.of(entry("Citigroup", true, RANKED, MEMBER, "citi", "citigroup")))
                .companies().get(0);

        assertThat(citi.matches("Citi")).isTrue();
        assertThat(citi.matches("CITI, N.A.")).isTrue();
        assertThat(citi.matches("Citigroup Inc.")).isTrue();
        assertThat(citi.matches("The Citi Group")).isTrue();
        // Not inside another word, and not a different company.
        assertThat(citi.matches("Citizens Bank")).isFalse();
        assertThat(citi.matches("Citibank")).isFalse();
        assertThat(citi.matches("Capital One")).isFalse();
        assertThat(citi.matches("")).isFalse();
        assertThat(citi.matches("  ")).isFalse();
        assertThat(citi.matches(null)).isFalse();
    }

    @Test
    void theCompanysOwnNameIsNotAnAlias_soAGenericNameCannotMatchByItself() {
        Company block = AllowList.of("x", List.of(entry("Block", true, RANKED, MEMBER, "block, inc.", "cash app")))
                .companies().get(0);

        assertThat(block.matches("Block, Inc.")).isTrue();
        assertThat(block.matches("Cash App")).isTrue();
        assertThat(block.matches("H&R Block")).isFalse();
        assertThat(block.matches("Block")).isFalse();
    }

    @Test
    void punctuationAndCaseDoNotMatter() {
        Company bank = AllowList.of("x", List.of(entry("M&T Bank", true, RANKED, MEMBER, "m&t bank", "u.s. bank")))
                .companies().get(0);

        assertThat(bank.matches("M & T Bank Corporation")).isTrue();
        assertThat(bank.matches("m&t bank")).isTrue();
        assertThat(bank.matches("U.S. Bank")).isTrue();
        assertThat(bank.matches("US Bank")).isFalse();
    }

    // ── the file in the repository ───────────────────────────────────────────

    @Test
    void theFileInTheRepositoryLoads_withEvidenceForEveryCompanyThatCounts() throws Exception {
        ObjectMapper mapper = JsonMapper.builder().build();
        AllowList real = new AllowList(mapper);

        assertThat(real.loadError()).isNull();
        assertThat(real.compiledOn()).matches("\\d{4}-\\d{2}-\\d{2}");
        assertThat(real.companies()).hasSizeGreaterThan(20);
        assertThat(real.companies()).extracting(Company::name).doesNotHaveDuplicates()
                .contains("JPMorgan Chase", "Goldman Sachs Group", "Morgan Stanley", "Charles Schwab");
        assertThat(real.companies()).allSatisfy(company -> {
            assertThat(company.searchName()).isNotBlank();
            assertThat(company.aliases()).isNotEmpty();
        });

        AllowList.AllowListFile file;
        try (InputStream in = getClass().getClassLoader().getResourceAsStream(AllowList.RESOURCE)) {
            file = mapper.readValue(in, AllowList.AllowListFile.class);
        }
        List<Entry> included = file.companies().stream().filter(e -> Boolean.TRUE.equals(e.included())).toList();
        // Nothing marked included was dropped for missing evidence.
        assertThat(included).hasSameSizeAs(real.companies());
        assertThat(included).allSatisfy(entry -> {
            assertThat(entry.fortune500().rank()).isBetween(1, 500);
            assertThat(entry.fortune500().source()).startsWith("https://fortune.com/");
            assertThat(entry.finra()).isNotEmpty().allSatisfy(firm -> {
                assertThat(firm.crd()).isPositive();
                assertThat(firm.source()).isEqualTo("https://brokercheck.finra.org/firm/summary/" + firm.crd());
            });
        });
        // Every company that does not count says why.
        assertThat(file.companies()).filteredOn(e -> !Boolean.TRUE.equals(e.included()))
                .isNotEmpty()
                .allSatisfy(entry -> assertThat(entry.excludedReason()).isNotBlank());
        // Companies that fail one of the two tests are not in.
        assertThat(real.companies()).extracting(Company::name)
                .doesNotContain("American Express", "Visa", "T. Rowe Price", "Fidelity Investments / FMR");
    }

    @Test
    void employersOnRealListingsMatchTheRightCompanyOnly() {
        AllowList real = new AllowList(JsonMapper.builder().build());

        assertThat(matching(real, "JPMorgan Chase & Co.")).containsExactly("JPMorgan Chase");
        assertThat(matching(real, "JPMorganChase")).containsExactly("JPMorgan Chase");
        assertThat(matching(real, "Citi")).containsExactly("Citigroup");
        assertThat(matching(real, "Wells Fargo Bank")).containsExactly("Wells Fargo");
        assertThat(matching(real, "First Citizens Bank")).containsExactly("First Citizens BancShares");
        // Names that only look similar belong to nobody on the list.
        for (String other : List.of("Chase Brass", "Citizens Bank of Edmond", "H&R Block", "Fidelity Investments",
                "Huntington Ingalls Industries", "Lincoln Electric", "Hartford HealthCare", "Nationwide Children's Hospital",
                "Guardian Pharmacy", "Pershing Square", "Apollo Education", "Prudential plc", "Acme Software")) {
            assertThat(matching(real, other)).as(other).isEmpty();
        }
    }

    private static List<String> matching(AllowList list, String employer) {
        return list.companies().stream().filter(c -> c.matches(employer)).map(Company::name).toList();
    }

    @Test
    void aFileThatCannotBeRead_leavesAnEmptyListInsteadOfFailing() throws Exception {
        ObjectMapper broken = mock(ObjectMapper.class);
        when(broken.readValue(any(InputStream.class), eq(AllowList.AllowListFile.class)))
                .thenThrow(new IllegalStateException("boom"));

        AllowList list = new AllowList(broken);

        assertThat(list.companies()).isEmpty();
        assertThat(list.compiledOn()).isNull();
        assertThat(list.loadError()).contains("market/allow-list.json").contains("IllegalStateException");

        // A file that parses to nothing is empty, not an error.
        AllowList empty = new AllowList(mock(ObjectMapper.class));
        assertThat(empty.companies()).isEmpty();
        assertThat(empty.loadError()).isNull();
    }
}
