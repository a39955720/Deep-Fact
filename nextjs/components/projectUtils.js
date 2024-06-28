// projectUtils.js

export const sortProjectsByTime = (projects, timestamps) => {
    const projectWithTimestamps = projects.map((project, index) => ({
        project,
        timestamp: timestamps[index]
    }))

    projectWithTimestamps.sort((a, b) => b.timestamp - a.timestamp)

    return projectWithTimestamps.map(item => item.project)
}
export const options = [
    { value: 'Sort by Time', label: 'Sort by Time (Older to Newest)' },
    { value: 'Filter by Answered', label: 'Filter by Answered' }
]
export const filterProjectsWithAuditorResponses = (projects, auditors) => {
    return projects.filter((_, index) => {
        return auditors[index].some(auditor => auditor !== "0x0000000000000000000000000000000000000000")
    })
}