package com.resume.market;

import java.util.List;

/** Where listings come from. One implementation: {@link AdzunaClient}. */
public interface ListingsClient {

    /** What one query returned, and how many HTTP requests it took (retries included). */
    record Page(List<Listing> listings, int apiCalls) {}

    /**
     * Recent listings the source attributes to this company for this role's search. The
     * caller still checks each listing's employer and title.
     *
     * @throws ListingsException when the source could not be read, after any retries
     */
    Page fetch(AllowList.Company company, TargetRoles.Role role);
}
